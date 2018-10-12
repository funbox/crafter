const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const CrafterError = utils.CrafterError;

const BlueprintElement = require('./elements/BlueprintElement');
const StringElement = require('./elements/StringElement');

module.exports = (Parsers) => {
  Parsers.BlueprintParser = {
    parse(node, context) {
      this.preprocessNestedSections(node, context);

      let curNode = node;

      let title = null;
      if (curNode.type === 'heading') {
        const titleText = utils.headerText(curNode, context.sourceLines); // Что если внутри хедера ссылки и все такое?
        title = new StringElement(titleText);
        if (context.sourceMapsEnabled) {
          title.sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines);
        }

        curNode = curNode.next;
      } else {
        // Сделать warning
      }

      let description = '';

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines, context.sourceMapsEnabled);

      const result = new BlueprintElement(title, description);

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);

        let childResult;

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
          case SectionTypes.resourcePrototypes:
            [curNode, childResult] = Parsers.ResourcePrototypesParser.parse(curNode, context);
            break;
          default:
            console.log('unknown node');
            curNode = curNode.next;
        }

        if (childResult) {
          result.content.push(childResult);
        }
      }

      return [null, result];
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    preprocessNestedSections(node, context) {
      const usedFiles = [context.currentFileName()];
      let curNode = node;
      context.logger.suppressWarnings();

      this.resolveImports(curNode, context, usedFiles);

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);
        let resourcePrototypeGroup;

        switch (nodeType) {
          case SectionTypes.dataStructureGroup:
            [curNode] = Parsers.DataStructureGroupParser.parse(curNode, context);
            break;
          case SectionTypes.resourcePrototypes:
            [curNode, resourcePrototypeGroup] = Parsers.ResourcePrototypesParser.parse(curNode, context);
            resourcePrototypeGroup.resourcePrototypes.forEach((proto) => {
              context.addResourcePrototype(proto);
            });
            break;
          default:
            curNode = curNode.next;
        }
      }

      context.typeResolver.resolveRegisteredTypes();
      context.resourcePrototypeResolver.resolveRegisteredPrototypes();
      context.logger.enableWarnings();
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

          if (!childAst.firstChild) {
            throw new CrafterError(`File import error. File "${filename}" is empty.`);
          }

          if (childAst.firstChild.type !== 'heading') {
            throw new CrafterError(`Invalid content of "${filename}". Expected content to be a section, instead got "${childAst.firstChild.type}".`);
          }

          addSourceLinesAndFilename(childAst, childSourceLines, context.resolvePathRelativeToEntryFile(filename));
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
};

function addSourceLinesAndFilename(ast, sourceLines, filename) {
  const walker = ast.walker();
  let event = walker.next();
  let node;

  while (event) {
    node = event.node;
    node.sourceLines = sourceLines;
    node.file = filename;
    event = walker.next();
  }
}
