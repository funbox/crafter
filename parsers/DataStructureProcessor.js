const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const ObjectElement = require('./elements/ObjectElement');

class DataStructureProcessor {
  constructor(valueMemberRootNode, Parsers) {
    this.valueMemberRootNode = valueMemberRootNode;
    this.Parsers = Parsers;
  }

  fillValueMember(valueMember, context) {
    const curNode = this.valueMemberRootNode.firstChild;

    if (curNode && !(valueMember.isComplex())) {
      console.log('sub-types of primitive types should not have nested members, ignoring unrecognized block');
      return;
    }

    if (valueMember.isObject()) {
      valueMember.content = this.buildObject(curNode, context);
    }

    if (valueMember.isArray()) {
      // ... - тут должен быть парсинг ValueMember

      // valueMember.content = this.buildArray(curNode, context);
    }
  }

  buildObject(node, context) {
    const objectElement = new ObjectElement();
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONAttributeParser,
        this.Parsers.MSONMixinParser,
      ]);

      switch (sectionType) {
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

      objectElement.propertyMembers.push(childResult);

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    return objectElement;
  }
}

module.exports = DataStructureProcessor;
