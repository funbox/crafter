const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const CrafterError = utils.CrafterError;

const BlueprintElement = require('./elements/BlueprintElement');
const StringElement = require('./elements/StringElement');
const MetaDataElement = require('./elements/MetaDataElement');
const AnnotationElement = require('./elements/AnnotationElement');

module.exports = (Parsers) => {
  Parsers.BlueprintParser = {
    parse(node, context) {
      try {
        this.preprocessNestedSections(node, context);
      } catch (error) {
        if (context.debugMode) {
          throw error;
        }
        context.error = error;
      }

      let curNode = node;

      let title = new StringElement('');
      const metadataArray = [];

      if (context.error) {
        const errorResult = new BlueprintElement(title, undefined, metadataArray);
        preprocessErrorResult(errorResult, context);
        return [null, errorResult, context.filePaths];
      }

      while (curNode.type === 'paragraph') {
        let isWarningAdded = false;
        const nodeText = utils.nodeText(curNode, context.sourceLines);
        nodeText.split('\n').forEach(line => { // eslint-disable-line no-loop-func
          const [key, ...rest] = line.split(':');
          const value = rest.join(':');
          if (key && value) {
            const element = new MetaDataElement(key, value);
            element.sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            metadataArray.push(element);
          } else if (!isWarningAdded) {
            isWarningAdded = true;
            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            context.addWarning('ignoring possible metadata, expected "<key> : <value>", one per line', sourceMap);
          }
        });
        curNode = curNode.next;
      }

      if (curNode.type === 'heading' && context.sectionKeywordSignature(curNode) === 'undefined') {
        const titleText = utils.headerText(curNode, context.sourceLines); // Что если внутри хедера ссылки и все такое?
        title = new StringElement(titleText);
        title.sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

        curNode = curNode.next;
      } else {
        const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        context.addWarning('expected API name, e.g. "# <API Name>"', sourceMap);
      }

      let description = '';

      const stopCallback = cNode => (cNode.type === 'heading' && context.sectionKeywordSignature(cNode) !== SectionTypes.undefined);

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback);

      const result = new BlueprintElement(title, description, metadataArray);

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);

        let childResult;

        try {
          switch (nodeType) {
            case SectionTypes.namedAction:
              [curNode, childResult] = Parsers.NamedEndpointParser.parse(curNode, context);
              break;
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
            default: {
              const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
              context.addWarning('unknown node', sourceMap);
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
        }
      }

      if (context.error) {
        preprocessErrorResult(result, context);
      }

      context.warnings.forEach(warning => {
        result.annotations.push(new AnnotationElement('warning', warning.text, warning.sourceMap));
      });

      return [null, result, context.filePaths];
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.NamedEndpointParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    preprocessNestedSections(node, context) {
      const usedFiles = context.currentFile ? [context.currentFileName()] : [];

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

      this.resolveImports(node, context, usedFiles);

      walkAST({
        [SectionTypes.schemaStructureGroup]: (curNode) => {
          const [nextNode, schemaStructureGroup] = Parsers.SchemaStructureGroupParser.parse(curNode, context);
          schemaStructureGroup.schemaStructures.forEach((schemaType) => {
            const typeName = schemaType.name.string;
            if ((!context.getType(typeName))) {
              context.addType(schemaType, schemaType);
            } else {
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
              context.addType(namedType, namedType.content);
            } else {
              throw new CrafterError(`${typeName} type already defined`, namedType.name.sourceMap);
            }
          });
          return nextNode;
        },
      });

      context.typeExtractingInProgress = false;

      walkAST({
        [SectionTypes.dataStructureGroup]: (curNode) => {
          const [nextNode, dataStructureGroup] = Parsers.DataStructureGroupParser.parse(curNode, context);
          dataStructureGroup.dataStructures.forEach((namedType) => {
            context.addType(namedType, namedType.content);
          });
          return nextNode;
        },
      });

      context.typeResolver.resolveRegisteredTypes();

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
    },

    resolveImports(entryNode, context, usedFiles) {
      const { sourceLines } = context;
      const ImportRegex = /^[Ii]mport\s+(.+)$/;
      const parentNode = entryNode.parent;
      const newChildren = [];
      let curNode = entryNode;

      const textFromNode = node => utils.headerText(node, sourceLines);

      while (curNode) {
        if (curNode.type === 'heading' && ImportRegex.test(textFromNode(curNode))) {
          if (!context.entryDir) {
            throw new CrafterError('Import error. Entry directory should be defined.');
          }

          const filename = ImportRegex.exec(textFromNode(curNode))[1].trim();

          if (!/\.apib$/.test(filename)) {
            throw new CrafterError(`File import error. File "${filename}" must have extension type ".apib".`);
          }

          if (usedFiles.includes(filename)) {
            throw new CrafterError(`Recursive import: ${usedFiles.join(' → ')} → ${filename}`);
          }

          usedFiles.push(filename);

          const { ast: childAst, context: childContext } = context.getApibAST(filename);
          const childSourceLines = childContext.sourceLines;
          const childSourceBuffer = childContext.sourceBuffer;
          const childLinefeedOffsets = childContext.linefeedOffsets;

          if (!childAst.firstChild) {
            throw new CrafterError(`File import error. File "${filename}" is empty.`);
          }

          if (childAst.firstChild.type !== 'heading') {
            throw new CrafterError(`Invalid content of "${filename}". Expected content to be a section, instead got "${childAst.firstChild.type}".`);
          }

          context.filePaths.push(`${context.resolvePathRelativeToEntryDir(filename)}`);

          addSourceLinesAndFilename(childAst, childSourceLines, childSourceBuffer, childLinefeedOffsets, context.resolvePathRelativeToEntryDir(filename));
          this.resolveImports(childAst.firstChild, childContext, usedFiles);

          let childNode = childAst.firstChild;
          while (childNode) {
            newChildren.push(childNode);
            childNode = childNode.next;
          }

          usedFiles.pop();
        } else {
          if (curNode.firstChild) {
            this.resolveImports(curNode.firstChild, context, usedFiles);
          }
          newChildren.push(curNode);
        }
        curNode = curNode.next;
      }

      if (newChildren.length > 0) {
        let childNode = parentNode.firstChild;

        while (childNode) {
          const nextNode = childNode.next;
          childNode.unlink();
          childNode = nextNode;
        }

        newChildren.forEach((child) => {
          parentNode.appendChild(child);
        });
      }
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
