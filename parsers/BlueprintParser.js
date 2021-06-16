const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ByteBlock = require('../utils/sourceMap/ByteBlock');
const { getEndingLinefeedLengthInBytes, getTrailingEmptyLinesLengthInBytes } = require('../utils');

const CrafterError = utils.CrafterError;

const BlueprintElement = require('./elements/BlueprintElement');
const StringElement = require('./elements/StringElement');
const MetaDataElement = require('./elements/MetaDataElement');
const AnnotationElement = require('./elements/AnnotationElement');
const UnrecognizedBlockElement = require('./elements/UnrecognizedBlockElement');

module.exports = (Parsers) => {
  Parsers.BlueprintParser = {
    async parse(node, context) {
      if (!node) {
        return [null, new BlueprintElement(new StringElement(''), null, []), context.filePaths];
      }

      try {
        await this.preprocessNestedSections(node, context);
      } catch (error) {
        if (context.debugMode) {
          throw error;
        }
        context.error = error;
      }

      let curNode = node;
      let title = new StringElement('');
      const sourceMaps = [];

      if (context.error) {
        const errorResult = new BlueprintElement(title, undefined, []);
        preprocessErrorResult(errorResult, context);
        return [null, errorResult, context.filePaths];
      }

      const [metaElements, metaSourceMaps, nextNode] = this.extractMetadata(curNode, context);
      curNode = nextNode;
      sourceMaps.push(...metaSourceMaps);

      if (curNode.type === 'heading' && context.sectionKeywordSignature(curNode) === SectionTypes.undefined) {
        const [titleText, titleTextOffset] = utils.headerTextWithOffset(curNode, context.sourceLines);
        title = utils.makeStringElement(titleText, titleTextOffset, curNode, context);
        const titleSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        sourceMaps.push(titleSourceMap);

        curNode = curNode.next;
      }

      let description = '';

      const stopCallback = cNode => (cNode.type === 'heading' && context.sectionKeywordSignature(cNode) !== SectionTypes.undefined);

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback);
      if (description) {
        sourceMaps.push(description.sourceMap);
      }

      const result = new BlueprintElement(title, description, metaElements);

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);

        let childResult;
        let childAnnotation;

        try {
          switch (nodeType) {
            case SectionTypes.resource:
              [curNode, childResult] = Parsers.ResourceParser.parse(curNode, context);
              break;
            case SectionTypes.resourceGroup:
              [curNode, childResult] = Parsers.ResourceGroupParser.parse(curNode, context);
              break;
            case SectionTypes.dataStructureGroup:
              [curNode, childResult] = Parsers.DataStructureGroupParser.parse(curNode, context);
              break;
            case SectionTypes.schemaStructureGroup:
              [curNode, childResult] = Parsers.SchemaStructureGroupParser.parse(curNode, context);
              break;
            case SectionTypes.resourcePrototypes:
              [curNode, childResult] = Parsers.ResourcePrototypesParser.parse(curNode, context);
              break;
            case SectionTypes.import: {
              if (curNode.importId) {
                const [nNode, importData] = await Parsers.ImportParser.parse(curNode, context);
                curNode = nNode;
                childResult = { elements: importData.refractElements, sourceMap: importData.sourceMap };
                childAnnotation = { elements: importData.refractAnnotations };
              } else {
                curNode = curNode.next;
              }
              break;
            }
            default: {
              const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
              result.unrecognizedBlocks.push(new UnrecognizedBlockElement(sourceMap));
              sourceMaps.push(sourceMap);
              context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, sourceMap);
              curNode = curNode.next;
            }
          }
        } catch (error) {
          if (context.debugMode) {
            throw error;
          }
          context.error = error;
          break;
        }

        if (childResult) {
          if (Array.isArray(childResult.elements)) {
            childResult.elements.forEach(element => { result.content.push(element); });
          } else {
            result.content.push(childResult);
          }
          sourceMaps.push(childResult.sourceMap);
        }

        if (childAnnotation) {
          if (Array.isArray(childAnnotation.elements)) {
            childAnnotation.elements.forEach(element => { result.annotations.push(element); });
          } else {
            result.annotations.push(childAnnotation);
          }
        }
      }

      if (context.error) {
        preprocessErrorResult(result, context);
      } else {
        result.sourceMap = utils.concatSourceMaps([...sourceMaps, ...context.importsSourceMaps]);
      }

      context.warnings.forEach(warning => {
        result.annotations.push(new AnnotationElement('warning', warning.text, warning.sourceMap));
      });

      return [null, result, context.filePaths];
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
        Parsers.ImportParser,
      ]);
    },

    async preprocessNestedSections(node, context) {
      const walkAST = async (sectionProcessors) => {
        let curNode = node;

        while (curNode) {
          const nodeType = this.nestedSectionType(curNode, context);
          if (sectionProcessors[nodeType]) {
            curNode = await sectionProcessors[nodeType](curNode);
          } else {
            curNode = curNode.next;
          }
        }
      };

      context.suppressWarnings();

      context.typeExtractingInProgress = true;

      await walkAST({
        [SectionTypes.schemaStructureGroup]: (curNode) => {
          const [nextNode, schemaStructureGroup] = Parsers.SchemaStructureGroupParser.parse(curNode, context);
          schemaStructureGroup.schemaStructures.forEach((schemaType) => {
            const typeName = schemaType.name.string;
            if ((!context.getType(typeName))) {
              context.addType(schemaType, schemaType, curNode.file || context.currentFile);
            } else if (!context.languageServerMode) {
              throw new CrafterError(`${typeName} type already defined`, schemaType.name.sourceMap);
            }
          });
          return nextNode;
        },
        [SectionTypes.dataStructureGroup]: (curNode) => {
          const [nextNode, dataStructureGroup] = Parsers.DataStructureGroupParser.parse(curNode, context);
          dataStructureGroup.dataStructures.forEach((namedType) => {
            const typeName = namedType.name.string;
            if ((!context.getType(typeName))) {
              context.addType(namedType, namedType.content, curNode.file || context.currentFile);
            } else if (!context.languageServerMode) {
              throw new CrafterError(`${typeName} type already defined`, namedType.name.sourceMap);
            }
          });
          return nextNode;
        },
        [SectionTypes.import]: async (curNode) => {
          const [nextNode, importedBlueprint] = await Parsers.ImportParser.parse(curNode, context);
          const { importedTypes, importedPrototypes, usedActions } = importedBlueprint;
          try {
            context.typeResolver.extendWith(importedTypes);
            context.resourcePrototypeResolver.extendWith(importedPrototypes);
            context.addActions(usedActions);
          } catch (e) {
            e.sourceMap = importedBlueprint.sourceMap;
            throw e;
          }
          return nextNode;
        },
      });

      context.typeExtractingInProgress = false;

      if (!context.languageServerMode) {
        await walkAST({
          [SectionTypes.dataStructureGroup]: (curNode) => {
            const [nextNode, dataStructureGroup] = Parsers.DataStructureGroupParser.parse(curNode, context);
            dataStructureGroup.dataStructures.forEach((namedType) => {
              context.addType(namedType, namedType.content, curNode.file || context.currentFile);
            });
            return nextNode;
          },
        });

        context.typeResolver.checkRegisteredTypes();
      }

      await walkAST({
        [SectionTypes.resourcePrototypes]: (curNode) => {
          const [nextNode, resourcePrototypeGroup] = Parsers.ResourcePrototypesParser.parse(curNode, context);
          resourcePrototypeGroup.resourcePrototypes.forEach((proto) => {
            context.addResourcePrototype(proto, curNode.file || context.currentFile);
          });
          return nextNode;
        },
      });

      context.resourcePrototypeResolver.resolveRegisteredPrototypes();
      context.enableWarnings();
    },

    extractMetadata(startNode, context) {
      const metadataArray = [];
      const sourceMaps = [];
      let curNode = startNode;

      while (curNode.type === 'paragraph') {
        let isWarningAdded = false;
        const nodeText = utils.nodeText(curNode, context.sourceLines);
        const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(curNode);
        let offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, context.sourceLines);

        nodeText.split('\n').forEach((line, lineIndex) => { // eslint-disable-line no-loop-func
          const [key, ...rest] = line.split(':');
          const value = rest.join(':');

          const blockOffset = offset;
          offset += line.length + getEndingLinefeedLengthInBytes(startLineIndex + lineIndex, context.sourceLines);

          if (!/\S/.test(context.sourceLines[startLineIndex + lineIndex + 1])) {
            offset += getTrailingEmptyLinesLengthInBytes(startLineIndex + lineIndex + 1, context.sourceLines);
          }

          const blockLength = offset - blockOffset;
          const byteBlock = new ByteBlock(blockOffset, blockLength, curNode.file);
          const charBlocks = utils.getCharacterBlocksWithLineColumnInfo([byteBlock], context.sourceBuffer, context.linefeedOffsets);
          const sourceMap = new utils.SourceMap([byteBlock], charBlocks);
          sourceMaps.push(sourceMap);

          if (key && value) {
            const element = new MetaDataElement(key, value);
            element.sourceMap = sourceMap;
            metadataArray.push(element);
          } else if (!isWarningAdded) {
            isWarningAdded = true;
            context.addWarning('ignoring possible metadata, expected "<key> : <value>", one per line', sourceMap);
          }
        });
        curNode = curNode.next;
      }

      return [metadataArray, sourceMaps, curNode];
    },
  };
  return true;
};

function preprocessErrorResult(result, context) {
  result.isError = true;
  result.annotations.push(new AnnotationElement('error', context.error.message, context.error.sourceMap));
}
