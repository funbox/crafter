const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

class DataStructureProcessor {
  constructor(valueMemberRootNode, Parsers) {
    this.valueMemberRootNode = valueMemberRootNode;
    this.Parsers = Parsers;
  }

  fillValueMember(valueMember, context) {
    let curNode = this.valueMemberRootNode.firstChild;

    if (curNode && !(valueMember.isObject() || valueMember.isArray())) {
      console.log('sub-types of primitive types should not have nested members, ignoring unrecognized block');
      return;
    }

    while (curNode) {
      let nextNode;
      let childResult;

      if (valueMember.isObject()) {
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

        valueMember.propertyMembers.push(childResult);
      } else { // valueMember.isArray() == true
        // [nextNode, childResult] = ... - тут должен быть парсинг ValueMember

        // valueMember.valueMembers.push(childResult);
      }



      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }
  }
}

module.exports = DataStructureProcessor;
