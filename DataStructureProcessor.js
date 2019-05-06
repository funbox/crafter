const SectionTypes = require('./SectionTypes');
const types = require('./types');
const utils = require('./utils');

const EnumElement = require('./parsers/elements/EnumElement');
const ObjectElement = require('./parsers/elements/ObjectElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const SampleValueProcessor = require('./parsers/SampleValueProcessor');
const DefaultValueProcessor = require('./parsers/DefaultValueProcessor');

const { standardTypes } = types;

class DataStructureProcessor {
  constructor(valueMemberRootNode, Parsers, startNode) {
    this.valueMemberRootNode = valueMemberRootNode;
    this.Parsers = Parsers;
    this.startNode = startNode;
  }

  fillValueMember(valueMember, context) {
    const curNode = this.startNode || this.valueMemberRootNode.firstChild;

    if (!valueMember.isComplex()) {
      this.processPrimitive(valueMember, curNode, context);
    }

    if (valueMember.isObject()) {
      const [object, samples, defaultElement] = this.buildObject(curNode, context);
      valueMember.content = object;

      if (samples.length > 0) {
        valueMember.samples = samples;
      }

      if (defaultElement) {
        valueMember.default = defaultElement;
      }
    }

    if (valueMember.isArray()) {
      this.processArray(valueMember, curNode, context);
    }

    if (valueMember.isEnum()) {
      valueMember.content = this.buildEnum(curNode, context, valueMember.rawType);
    }
  }

  processPrimitive(primitiveElement, node, context) {
    let curNode = node;
    const samples = [];
    const defaults = [];

    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines);
    const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.DefaultValueParser,
        this.Parsers.SampleValueParser,
      ]);

      switch (sectionType) {
        case SectionTypes.defaultValue:
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          defaults.push(childResult);
          break;
        case SectionTypes.sampleValue:
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          samples.push(childResult);
          break;
        default:
          context.addWarning('sub-types of primitive types should not have nested members, ignoring unrecognized block', charBlocks, sourceMap.file);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    if (samples.length) {
      primitiveElement.samples = primitiveElement.samples || [];
      const processedSamples = samples.map(sampleMember => {
        const sampleValueProcessor = new SampleValueProcessor(sampleMember, primitiveElement.type);
        sampleValueProcessor.prepareValuesForBody();
        sampleValueProcessor.buildSamplesFor(primitiveElement.type);
        return sampleMember;
      });
      primitiveElement.samples.push(...processedSamples);
    }

    if (defaults.length) {
      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', charBlocks, sourceMap.file);
        defaults.length = 1;
      }
      const defaultElement = defaults[0];
      const defaultValueProcessor = new DefaultValueProcessor(defaultElement, primitiveElement.type);
      defaultValueProcessor.prepareValuesForBody();
      defaultValueProcessor.buildDefaultFor(primitiveElement.type);
      primitiveElement.default = defaultElement;
    }
  }

  processArray(arrayElement, node, context) {
    let curNode = node;
    const arrayMembers = arrayElement.content.members;

    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines);
    const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
    const samples = [];
    const defaults = [];
    const predefinedType = arrayMembers.length ? arrayMembers[0].type : 'string';

    while (curNode) {
      let nextNode;
      let childResult;

      if (this.Parsers.SampleValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
        const sampleValueProcessor = new SampleValueProcessor(childResult, predefinedType);
        sampleValueProcessor.prepareValuesForBody();
        sampleValueProcessor.buildSamplesFor(types.array);
        samples.push(childResult);
      } else if (this.Parsers.DefaultValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
        defaults.push(childResult);
        break;
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

    if (defaults.length) {
      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', charBlocks, sourceMap.file);
        defaults.length = 1;
      }
      const defaultElement = defaults[0];
      const defaultValueProcessor = new DefaultValueProcessor(defaultElement, predefinedType);
      defaultValueProcessor.prepareValuesForBody();
      defaultValueProcessor.buildDefaultFor(types.array);
      arrayElement.default = defaultElement;
    }

    arrayMembers.forEach((member) => {
      if (!member.type && types.primitiveTypes.includes(predefinedType)) {
        member.type = predefinedType;
        const realValue = utils.convertType(member.value, predefinedType);
        if (!realValue.valid) {
          context.addWarning(`Invalid value "${member.value}" for "${predefinedType}" type`, charBlocks, sourceMap.file);
        }
        member.value = realValue.valid ? realValue.value : utils.defaultValue(predefinedType);
      }
    });
  }

  buildObject(node, context) {
    const objectElement = new ObjectElement();
    const samples = [];
    const defaults = [];
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;
      let samplesElement;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONMemberGroupParser,
        this.Parsers.SampleValueParser,
        this.Parsers.DefaultValueParser,
        this.Parsers.MSONMixinParser,
        this.Parsers.OneOfTypeParser,
        this.Parsers.MSONAttributeParser,
      ]);

      switch (sectionType) {
        case SectionTypes.msonAttribute:
          [nextNode, childResult] = this.Parsers.MSONAttributeParser.parse(curNode, context);
          break;
        case SectionTypes.msonMixin: {
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);
          const baseType = context.typeResolver.types[childResult.className];
          if (baseType && !baseType.isComplex()) {
            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines);
            const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
            context.addWarning('Mixin may not include a type of a primitive sub-type', charBlocks, sourceMap.file);
            childResult = null;
          }
          break;
        }
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
        case SectionTypes.defaultValue:
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          defaults.push(childResult);
          childResult = null;
          break;
        default: {
          // TODO что делать в этом случае? Прерывать парсинг или пропускать ноду?
          const [line, file] = utils.getDetailsForLogger(curNode);
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`, line, file);
        }
      }

      if (childResult) {
        objectElement.propertyMembers.push(childResult);
      }

      if (samplesElement) {
        const sampleValueProcessor = new SampleValueProcessor(samplesElement);
        sampleValueProcessor.prepareValuesForBody();
        sampleValueProcessor.buildSamplesFor(types.object);
        samples.push(samplesElement);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }

      curNode = curNode.next;
    }

    let defaultElement;

    if (defaults.length) {
      if (defaults.length > 1) {
        const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines);
        const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
        context.addWarning('Multiple definitions of "default" value', charBlocks, sourceMap.file);
        defaults.length = 1;
      }
      defaultElement = defaults[0];
      const defaultValueProcessor = new DefaultValueProcessor(defaultElement);
      defaultValueProcessor.prepareValuesForBody();
      defaultValueProcessor.buildDefaultFor(types.object);
    }

    return [objectElement, samples, defaultElement];
  }

  buildEnum(node, context, type) {
    const enumElement = new EnumElement(type);
    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines);
    const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
    const samples = [];
    const defaults = [];
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
          defaults.push(childResult);
          break;
        case SectionTypes.sampleValue:
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          samples.push(...childResult.values);
          break;
        case SectionTypes.enumMember:
          [nextNode, childResult] = this.Parsers.EnumMemberParser.parse(curNode, context);
          enumElement.members.push(childResult);
          break;
        default: {
          const [line, file] = utils.getDetailsForLogger(curNode);
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`, line, file);
        }
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
        sampleValueProcessor.prepareValuesForBody();
        sampleValueProcessor.buildSamplesFor(types.enum);
        return sampleElement;
      });
    }

    if (defaults.length) {
      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', charBlocks, sourceMap.file);
        defaults.length = 1;
      }
      const defaultElement = defaults[0];
      const defaultValueProcessor = new DefaultValueProcessor(defaultElement, enumElement.type);
      defaultValueProcessor.prepareValuesForBody();
      defaultValueProcessor.buildDefaultFor(types.enum);
      enumElement.defaultValue = defaultElement;
    }

    if (!standardTypes.includes(enumElement.type)) {
      context.addWarning('Enum must not use named types as a sub-type. Sub-type "string" will be used instead.', charBlocks, sourceMap.file);
      enumElement.type = 'string';
    }

    enumElement.members.forEach((member) => {
      const converted = utils.convertType(member.name, enumElement.type);
      const typesMatch = utils.compareAttributeTypes(enumElement, member);

      if (!typesMatch) {
        context.addWarning(`Invalid value format "${member.name}" for enum type '${enumElement.type}'.`, charBlocks, sourceMap.file);
      }

      member.name = converted.valid ? converted.value : utils.defaultValue(enumElement.type);

      if (!member.type) member.type = enumElement.type;
    });

    return enumElement;
  }
}

module.exports = DataStructureProcessor;
