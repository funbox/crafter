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

      let importedBlueprints;

      try {
        importedBlueprints = await this.preprocessNestedSections(node, context);
      } catch (error) {
        if (context.debugMode) {
          throw error;
        }
        context.error = error;
      }

      let curNode = node;

      let title = new StringElement('');
      const metadataArray = [];
      const sourceMaps = [];

      if (context.error) {
        const errorResult = new BlueprintElement(title, undefined, metadataArray);
        preprocessErrorResult(errorResult, context);
        return [null, errorResult, context.filePaths];
      }

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

      if (curNode.type === 'heading' && context.sectionKeywordSignature(curNode) === SectionTypes.undefined) {
        const [titleText, titleTextOffset] = utils.headerTextWithOffset(curNode, context.sourceLines);
        title = utils.makeStringElement(titleText, titleTextOffset, curNode, context);
        const titleSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        sourceMaps.push(titleSourceMap);

        curNode = curNode.next;
      } else if (!context.importedFile) {
        const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        context.addWarning('expected API name, e.g. "# <API Name>"', sourceMap);
      }

      let description = '';

      const stopCallback = cNode => (cNode.type === 'heading' && context.sectionKeywordSignature(cNode) !== SectionTypes.undefined);

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback);
      if (description) {
        sourceMaps.push(description.sourceMap);
      }

      const result = new BlueprintElement(title, description, metadataArray);

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);

        let childResult;

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
              if (importedBlueprints && importedBlueprints.size > 0 && curNode.importId) {
                const { blueprint } = importedBlueprints.get(curNode.importId);
                result.annotations.push(...blueprint.annotations);
                result.content.push(...blueprint.content);
              }
              [curNode, childResult] = Parsers.ImportParser.parse(curNode, context);
              sourceMaps.push(childResult.sourceMap);
              childResult = null;
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
          result.content.push(childResult);
          sourceMaps.push(childResult.sourceMap);
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
      const walkAST = (sectionProcessors) => {
        let curNode = node;

        while (curNode) {
          const nodeType = this.nestedSectionType(curNode, context);
          if (sectionProcessors[nodeType]) {
            curNode = sectionProcessors[nodeType](curNode);
          } else {
            curNode = curNode.next;
          }
        }
      };

      context.suppressWarnings();

      context.typeExtractingInProgress = true;

      const importedBlueprints = await this.resolveImports(node, context);

      if (importedBlueprints && importedBlueprints.size > 0) {
        importedBlueprints.forEach((value) => {
          const { importedTypes, importedPrototypes, usedActions } = value;
          context.typeResolver.extendWith(importedTypes);
          context.resourcePrototypeResolver.extendWith(importedPrototypes);
          context.addActions(usedActions);
        });
      }

      walkAST({
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
      });

      context.typeExtractingInProgress = false;

      if (!context.languageServerMode) {
        walkAST({
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

      walkAST({
        [SectionTypes.resourcePrototypes]: (curNode) => {
          const [nextNode, resourcePrototypeGroup] = Parsers.ResourcePrototypesParser.parse(curNode, context);
          resourcePrototypeGroup.resourcePrototypes.forEach((proto) => {
            context.addResourcePrototype(proto);
          });
          return nextNode;
        },
      });

      context.resourcePrototypeResolver.resolveRegisteredPrototypes();
      context.enableWarnings();

      return importedBlueprints;
    },

    async resolveImports(entryNode, context) {
      const { usedFiles } = context;
      let curNode = entryNode;
      const nodesToRemove = [];
      const childBlueprintsContainer = new Map();

      while (curNode) {
        if (Parsers.ImportParser.sectionType(curNode, context) === SectionTypes.import) {
          const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          context.importsSourceMaps.push(sourceMap);

          if (!context.entryDir) {
            throw new CrafterError('Import error. Entry directory should be defined.', sourceMap);
          }

          try {
            const filename = Parsers.ImportParser.getFilename(curNode, context);
            const importId = filename;

            if (!/\.apib$/.test(filename)) {
              throw new CrafterError(`File import error. File "${filename}" must have extension type ".apib".`, sourceMap);
            }

            if (usedFiles.includes(filename)) {
              throw new CrafterError(`Recursive import: ${usedFiles.join(' → ')} → ${filename}`, sourceMap);
            }

            const { ast: childAst, context: childContext } = await context.getApibAST(filename, sourceMap);
            const childSourceLines = childContext.sourceLines;
            const childSourceBuffer = childContext.sourceBuffer;
            const childLinefeedOffsets = childContext.linefeedOffsets;

            if (!childAst.firstChild) {
              throw new CrafterError(`File import error. File "${filename}" is empty.`, sourceMap);
            }

            let childNodeToCheck = childAst.firstChild;

            while (childNodeToCheck && Parsers.ImportParser.sectionType(childNodeToCheck, childContext) === SectionTypes.import) {
              // файл может начинаться с импорта, в таком случае, его нужно пропустить
              childNodeToCheck = childNodeToCheck.next;
            }
            if (childNodeToCheck && this.nestedSectionType(childNodeToCheck, childContext) === SectionTypes.undefined) {
              throw new CrafterError(`Invalid content of "${filename}". Can't recognize "${utils.nodeText(childNodeToCheck, childContext.sourceLines)}" as API Blueprint section.`, sourceMap);
            }

            context.filePaths.push(`${context.resolvePathRelativeToEntryDir(filename)}`);

            addSourceLinesAndFilename(childAst, childSourceLines, childSourceBuffer, childLinefeedOffsets, context.resolvePathRelativeToEntryDir(filename));
            context.importsSourceMaps.push(...childContext.importsSourceMaps);
            childContext.importedFile = true;
            childContext.usedFiles.unshift(...context.usedFiles);

            const [, importedBlueprint] = await Parsers.BlueprintParser.parse(childAst.firstChild, childContext);
            const importedBlueprintError = findError(importedBlueprint);

            if (importedBlueprintError) {
              const importError = new Error(importedBlueprintError.text);
              importError.sourceMap = importedBlueprintError.sourceMap;
              throw importError;
            }

            childBlueprintsContainer.set(importId, {
              blueprint: importedBlueprint,
              importedTypes: {
                types: childContext.typeResolver.types,
                typeNames: childContext.typeResolver.typeNames,
                typeLocations: childContext.typeResolver.typeLocations,
              },
              importedPrototypes: {
                prototypes: childContext.resourcePrototypeResolver.prototypes,
                resolvedPrototypes: childContext.resourcePrototypeResolver.resolvedPrototypes,
              },
              usedActions: Array.from(childContext.usedActions),
              importSourceMap: sourceMap,
            });

            curNode.importId = importId;

            // Если в Language Server Mode случится ошибка и до этой инструкции выполнение не дойдет,
            // то при повторной попытке импорта данного файла случится Recursive import.
            // На практике ничего страшного не произойдет, т.к. ошибка случится только в случае,
            // если файл некорректный, поэтому в любом случае при попытке повторного импорта произошла бы
            // ошибка, а для данного режима не важно какая именно ошибка произойдет.
            usedFiles.pop();
          } catch (e) {
            nodesToRemove.push(curNode);
            if (!context.languageServerMode) {
              throw e;
            }
          }
        }
        curNode = curNode.next;
      }

      // нода удаляется из ast только в случае, если импорт с ошибкой
      nodesToRemove.forEach(node => node.unlink());

      return childBlueprintsContainer;
    },
  };
  return true;
};

function addSourceLinesAndFilename(ast, sourceLines, sourceBuffer, linefeedOffsets, filename) {
  const walker = ast.walker();
  let event = walker.next();
  let node;

  while (event) {
    node = event.node;
    node.sourceLines = sourceLines;
    node.sourceBuffer = sourceBuffer;
    node.linefeedOffsets = linefeedOffsets;
    node.file = filename;
    event = walker.next();
  }
}

function preprocessErrorResult(result, context) {
  result.isError = true;
  result.annotations.push(new AnnotationElement('error', context.error.message, context.error.sourceMap));
}

function findError(blueprintElement) {
  return blueprintElement.annotations.find(anno => anno.type === 'error');
}
