const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const EnumElement = require('./elements/EnumElement');
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
      const [object, samples] = this.buildObject(curNode, context);
      valueMember.content = object;

      if (samples.length > 0) {
        valueMember.samples = samples;
      }
    }

    if (valueMember.isArray()) {
      this.processArray(valueMember, curNode, context);
    }

    if (valueMember.isEnum()) {
      valueMember.content = this.buildEnum(curNode, context, valueMember.rawType);
    }
  }

  processArray(arrayElement, node, context) {
    let curNode = node;
    const arrayMembers = arrayElement.content.members;
    const samplesArray = [];
    const predefinedType = arrayMembers.length ? arrayMembers[0].type : 'string';

    while (curNode) {
      let nextNode;
      let childResult;
      let samplesElement;

      if (this.Parsers.SampleValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        [nextNode, samplesElement] = this.Parsers.SampleValueParser.parse(curNode, context);
        samplesElement.type = predefinedType;
        samplesArray.push(samplesElement);
      } else {
        [nextNode, childResult] = this.Parsers.ArrayMemberParser.parse(curNode, context);
        arrayMembers.push(childResult);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    if (samplesArray.length) {
      arrayElement.samples = samplesArray;
    }
  }

  buildObject(node, context) {
    const objectElement = new ObjectElement();
    const samplesArray = [];
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;
      let samplesElement;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.SampleValueParser,
        this.Parsers.MSONMixinParser,
        this.Parsers.OneOfTypeParser,
        this.Parsers.MSONAttributeParser,
      ]);

      switch (sectionType) {
        case SectionTypes.msonAttribute:
          [nextNode, childResult] = this.Parsers.MSONAttributeParser.parse(curNode, context);
          break;
        case SectionTypes.msonMixin:
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);
          break;
        case SectionTypes.oneOfType:
          [nextNode, childResult] = this.Parsers.OneOfTypeParser.parse(curNode, context);
          break;
        case SectionTypes.sampleValue:
          [nextNode, samplesElement] = this.Parsers.SampleValueParser.parse(curNode, context);
          break;

        default:
          // TODO что делать в этом случае? Прерывать парсинг или пропускать ноду?
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`);
      }

      if (childResult) {
        objectElement.propertyMembers.push(childResult);
      }

      if (samplesElement) {
        samplesArray.push(samplesElement);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }

      curNode = curNode.next;
    }

    return [objectElement, samplesArray];
  }

  buildEnum(node, context, type) {
    const enumElement = new EnumElement(type);
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.DefaultValueParser,
        this.Parsers.SampleValueParser,
        this.Parsers.EnumMemberParser,
      ]);

      switch (sectionType) {
        case SectionTypes.defaultValue:
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          enumElement.defaultValue = childResult;
          break;
        case SectionTypes.sampleValue:
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          enumElement.sampleValue = childResult;
          break;
        case SectionTypes.enumMember:
          [nextNode, childResult] = this.Parsers.EnumMemberParser.parse(curNode, context);
          enumElement.members.push(childResult);
          break;
        default:
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    return enumElement;
  }
}

module.exports = DataStructureProcessor;
