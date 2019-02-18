const SectionTypes = require('./SectionTypes');
const types = require('./types');
const utils = require('./utils');

const EnumElement = require('./parsers/elements/EnumElement');
const ObjectElement = require('./parsers/elements/ObjectElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const SampleValueProcessor = require('./parsers/SampleValueProcessor');

const { standardTypes } = types;

class DataStructureProcessor {
  constructor(valueMemberRootNode, Parsers, startNode) {
    this.valueMemberRootNode = valueMemberRootNode;
    this.Parsers = Parsers;
    this.startNode = startNode;
  }

  fillValueMember(valueMember, context) {
    const curNode = this.startNode || this.valueMemberRootNode.firstChild;

    if (curNode && !(valueMember.isComplex())) {
      context.logger.warn('sub-types of primitive types should not have nested members, ignoring unrecognized block', utils.getDetailsForLogger(curNode));
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
    const samples = [];
    const predefinedType = arrayMembers.length ? arrayMembers[0].type : 'string';

    while (curNode) {
      let nextNode;
      let childResult;

      if (this.Parsers.SampleValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
        const sampleValueProcessor = new SampleValueProcessor(childResult, predefinedType);
        sampleValueProcessor.buildSamplesFor(types.array);
        samples.push(childResult);
      } else if (this.Parsers.MSONMemberGroupParser.sectionType(curNode, context) === SectionTypes.msonArrayMemberGroup) {
        [nextNode, childResult] = this.Parsers.MSONMemberGroupParser.parse(curNode, context);
        arrayMembers.push(...childResult.members);
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

    if (samples.length) {
      arrayElement.samples = arrayElement.samples || [];
      arrayElement.samples.push(...samples);
    }
  }

  buildObject(node, context) {
    const objectElement = new ObjectElement();
    const samples = [];
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;
      let samplesElement;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONMemberGroupParser,
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
        case SectionTypes.msonObjectMemberGroup:
          [nextNode, childResult] = this.Parsers.MSONMemberGroupParser.parse(curNode, context);
          objectElement.propertyMembers.push(...childResult.members);
          childResult = null;
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
        const sampleValueProcessor = new SampleValueProcessor(samplesElement);
        sampleValueProcessor.buildSamplesFor(types.object);
        samples.push(samplesElement);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }

      curNode = curNode.next;
    }

    return [objectElement, samples];
  }

  buildEnum(node, context, type) {
    const enumElement = new EnumElement(type);
    const enumSignatureDetails = utils.getDetailsForLogger(this.valueMemberRootNode.parent);
    const samples = [];
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONMemberGroupParser,
        this.Parsers.DefaultValueParser,
        this.Parsers.SampleValueParser,
        this.Parsers.EnumMemberParser,
      ]);

      switch (sectionType) {
        case SectionTypes.msonEnumMemberGroup:
          [nextNode, childResult] = this.Parsers.MSONMemberGroupParser.parse(curNode, context);
          enumElement.members.push(...childResult.members);
          childResult = null;
          break;
        case SectionTypes.defaultValue:
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          enumElement.defaultValue = childResult;
          break;
        case SectionTypes.sampleValue:
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          samples.push(...childResult.members);
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

    if (samples.length) {
      enumElement.sampleValues = samples.map(sampleMember => {
        const sampleElement = new SampleValueElement([sampleMember]);
        const sampleValueProcessor = new SampleValueProcessor(sampleElement, enumElement.type);
        sampleValueProcessor.buildSamplesFor(types.enum);
        return sampleElement;
      });
    }

    if (!standardTypes.includes(enumElement.type)) {
      context.logger.warn('Enum must not use named types as a sub-type. Sub-type "string" will be used instead.', enumSignatureDetails);
      enumElement.type = 'string';
    }

    enumElement.members.forEach((member) => {
      const typesMatch = utils.compareAttributeTypes(enumElement, member);

      if (!typesMatch) {
        context.logger.warn(`Invalid value format "${member.name}" for enum type '${enumElement.type}'.`, enumSignatureDetails);
      }

      if (!member.type) member.type = enumElement.type;
    });

    return enumElement;
  }
}

module.exports = DataStructureProcessor;