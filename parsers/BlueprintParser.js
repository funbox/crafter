const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const BlueprintElement = require('./elements/BlueprintElement');

module.exports = (Parsers) => {
  Parsers.BlueprintParser = {
    parse(node, context) {
      this.extractTypes(node, context);

      let curNode = node;

      let title = '';
      if (curNode.type === 'heading') {
        title = utils.headerText(curNode, context.sourceLines); // Что если внутри хедера ссылки и все такое?

        curNode = curNode.next;
      } else {
        // Сделать warning
      }

      let description = '';

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

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

    extractTypes(node, context) {
      let curNode = node;

      while (curNode) {
        const nodeType = this.nestedSectionType(curNode, context);
        let dataStructuresGroup;

        switch (nodeType) {
          case SectionTypes.dataStructureGroup:
            [curNode, dataStructuresGroup] = Parsers.DataStructureGroupParser.parse(curNode, context);
            dataStructuresGroup.dataStructures.forEach(ds => {
              context.addType(ds);
            });
            break;
          default:
            curNode = curNode.next;
        }
      }

      context.typeResolver.resolveRegisteredTypes();
    },

    skipSectionKeywordSignature: true,
  };
};