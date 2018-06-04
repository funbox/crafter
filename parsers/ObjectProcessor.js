const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

class ObjectProcessor {
  constructor(objectRootNode, Parsers) {
    this.objectRootNode = objectRootNode;
    this.Parsers = Parsers;
  }

  fillObject(object, context) {
    let curNode = this.objectRootNode.firstChild;

    while (curNode) {
      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONAttributeParser,
        this.Parsers.MSONMixinParser,
      ]);

      let nextNode;
      let childResult;

      switch(sectionType) {
        case SectionTypes.msonAttribute:
          [nextNode, childResult] = this.Parsers.MSONAttributeParser.parse(curNode, context);
          break;
        case SectionTypes.msonMixin:
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);
          break;

        default:
          // TODO что делать в этом случае? Прерывать парсинг или пропускать ноду?
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`);
      }

      object.content.push(childResult);

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }
  }
}

module.exports = ObjectProcessor;