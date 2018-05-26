const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

module.exports = (Parsers) => {
  Parsers.BlueprintParser = {
    parse(node, context) {
      const result = {
        element: Refract.elements.category,
        meta: {
          classes: Refract.categoryClasses.api, // TODO: Сделать как в новом drafter (element: string, content: строка)
        },
        content: [],
        title: '',
      };

      let curNode = node;

      if (curNode.type === 'heading') {
        result.title = utils.headerText(curNode, context.sourceLines); // Что если внутри хедера ссылки и все такое?

        curNode = curNode.next;
      } else {
        // Сделать warning
      }

      let description = '';

      [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

      if (description) {
        result.content.push({
          element: Refract.elements.copy,
          content: description,
        });
      }

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

      return [null, {
        element: Refract.elements.parseResult,
        content: [result]
      }];
    },

      nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    }
  };
};