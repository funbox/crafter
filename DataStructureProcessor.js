const SectionTypes = require('./SectionTypes');
const types = require('./types');
const utils = require('./utils');

const EnumElement = require('./parsers/elements/EnumElement');
const ObjectElement = require('./parsers/elements/ObjectElement');

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

  processPrimitive(primitiveElement, node, context) {
    let curNode = node;
    const samples = [];
    const defaults = [];

    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.DefaultValueParser,
        this.Parsers.SampleValueParser,
      ]);

      switch (sectionType) {
        case SectionTypes.defaultValue:
          context.data.typeForDefaults = 'primitive';
          context.data.valueType = primitiveElement.type;
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          delete context.data.typeForDefaults;
          delete context.data.valueType;
          defaults.push(...childResult);
          break;
        case SectionTypes.sampleValue:
          context.data.typeForSamples = 'primitive';
          context.data.valueType = primitiveElement.type;
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          delete context.data.typeForSamples;
          delete context.data.valueType;
          samples.push(...childResult);
          break;
        default:
          context.addWarning('sub-types of primitive types should not have nested members, ignoring unrecognized block', sourceMap);
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    if (samples.length) {
      primitiveElement.samples = primitiveElement.samples || [];
      primitiveElement.samples.push(...samples);
    }

    if (defaults.length) {
      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', sourceMap);
      }
      primitiveElement.default = defaults[0];
    }
  }

  processArray(arrayElement, node, context) {
    let curNode = node;
    const arrayMembers = arrayElement.content.members;

    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    const samples = [];
    const defaults = [];
    const predefinedType = arrayMembers.length ? arrayMembers[0].type : 'string';

    while (curNode) {
      let nextNode;
      let childResult;

      if (this.Parsers.SampleValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        context.data.typeForSamples = 'array';
        context.data.valueType = predefinedType;
        [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
        delete context.data.typeForSamples;
        delete context.data.valueType;
        samples.push(...childResult);
      } else if (this.Parsers.DefaultValueParser.sectionType(curNode, context) !== SectionTypes.undefined) {
        context.data.typeForDefaults = 'array';
        context.data.valueType = predefinedType;
        [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
        delete context.data.typeForDefaults;
        delete context.data.valueType;
        defaults.push(...childResult);
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
        context.addWarning('Multiple definitions of "default" value', sourceMap);
      }
      arrayElement.default = defaults[0];
    }

    arrayMembers.forEach((member) => {
      if (!member.type && types.primitiveTypes.includes(predefinedType)) {
        member.type = predefinedType;
        const realValue = utils.convertType(member.value, predefinedType);
        if (!realValue.valid) {
          context.addWarning(`Invalid value "${member.value}" for "${predefinedType}" type`, sourceMap);
        }
        member.value = realValue.valid ? realValue.value : utils.defaultValue(predefinedType);
      }
    });
  }

  buildObject(node, context) {
    const objectElement = new ObjectElement();
    const samples = [];
    let curNode = node;

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONMemberGroupParser,
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
            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            context.addWarning('Mixin may not include a type of a primitive sub-type', sourceMap);
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
        default: {
          // TODO что делать в этом случае? Прерывать парсинг или пропускать ноду?
          const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`, sourceMap);
        }
      }

      if (childResult) {
        objectElement.propertyMembers.push(childResult);
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
    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
          context.data.typeForDefaults = 'enum';
          context.data.valueType = enumElement.type;
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          defaults.push(...childResult);
          delete context.data.typeForDefaults;
          delete context.data.valueType;
          break;
        case SectionTypes.sampleValue:
          context.data.typeForSamples = 'enum';
          context.data.valueType = enumElement.type;
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          samples.push(...childResult);
          delete context.data.typeForSamples;
          delete context.data.valueType;
          break;
        case SectionTypes.enumMember:
          [nextNode, childResult] = this.Parsers.EnumMemberParser.parse(curNode, context);
          if (childResult.name) {
            const validEnumMemberTypes = ['string', 'number', 'boolean'];
            if (!childResult.type || validEnumMemberTypes.includes(childResult.type)) {
              enumElement.members.push(childResult);
            } else {
              context.addWarning(`Invalid enum member type: ${childResult.type}. Valid types: ${validEnumMemberTypes.join(', ')}.`, childResult.sourceMap);
            }
          } else {
            context.addWarning(`Enum members must have names: ${childResult.type}`, childResult.sourceMap);
          }
          break;
        default: {
          const errorSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          throw new utils.CrafterError(`invalid sectionType: ${sectionType}`, errorSourceMap);
        }
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    if (samples.length) {
      enumElement.sampleValues = samples;
    }

    if (defaults.length) {
      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', sourceMap);
      }
      enumElement.defaultValue = defaults[0];
    }

    if (!standardTypes.includes(enumElement.type)) {
      context.addWarning('Enum must not use named types as a sub-type. Sub-type "string" will be used instead.', sourceMap);
      enumElement.type = 'string';
    }

    enumElement.members.forEach((member) => {
      const converted = utils.convertType(member.name, enumElement.type);
      const typesMatch = utils.compareAttributeTypes(enumElement, member);

      if (!typesMatch) {
        context.addTypeMismatchWarning(member.name, enumElement.type, sourceMap);
      }

      member.name = converted.valid ? converted.value : utils.defaultValue(enumElement.type);

      if (!member.type) member.type = enumElement.type;
    });

    return enumElement;
  }
}

module.exports = DataStructureProcessor;
