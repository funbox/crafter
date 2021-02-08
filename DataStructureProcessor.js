const SectionTypes = require('./SectionTypes');
const types = require('./types');
const utils = require('./utils');
const utilsHelpers = require('./utils/index');

const EnumElement = require('./parsers/elements/EnumElement');
const ObjectElement = require('./parsers/elements/ObjectElement');
const SchemaNamedTypeElement = require('./parsers/elements/SchemaNamedTypeElement');
const MSONMixinElement = require('./parsers/elements/MSONMixinElement');
const UnrecognizedBlockElement = require('./parsers/elements/UnrecognizedBlockElement');

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
      this.processObject(valueMember, curNode, context);
    }

    if (valueMember.isArray()) {
      this.processArray(valueMember, curNode, context);
    }

    if (valueMember.isEnum()) {
      this.processEnum(valueMember, curNode, context);
    }

    if (valueMember.unrecognizedBlocks.length > 0) {
      const unrecognizedBlocksSourceMaps = valueMember.unrecognizedBlocks.map(ub => ub.sourceMap);

      if (valueMember.sourceMap) {
        valueMember.sourceMap = utils.concatSourceMaps([valueMember.sourceMap, ...unrecognizedBlocksSourceMaps]);
      } else {
        valueMember.sourceMap = utils.concatSourceMaps(unrecognizedBlocksSourceMaps);
      }
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
        default: {
          context.addWarning(`sub-types of primitive types should not have nested members, ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, sourceMap);
          const curNodeSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          primitiveElement.unrecognizedBlocks.push(new UnrecognizedBlockElement(curNodeSourceMap));
          nextNode = utils.nextNode(curNode);
        }
      }

      // TODO Что если nextNode !== curNode.next ?
      if (curNode.next && nextNode !== curNode.next) {
        throw new utils.CrafterError('nextNode !== curNode.next');
      }
      curNode = curNode.next;
    }

    const childSourceMaps = [];

    if (samples.length) {
      samples.forEach(sample => childSourceMaps.push(sample.sourceMap));

      primitiveElement.samples = primitiveElement.samples || [];
      primitiveElement.samples.push(...samples);
    }

    if (defaults.length) {
      defaults.forEach(d => childSourceMaps.push(d.sourceMap));

      if (defaults.length > 1) {
        context.addWarning('Multiple definitions of "default" value', sourceMap);
      }
      primitiveElement.default = defaults[0];
    }

    if (childSourceMaps.length) {
      if (primitiveElement.sourceMap) {
        primitiveElement.sourceMap = utils.concatSourceMaps([primitiveElement.sourceMap, ...childSourceMaps]);
      } else {
        primitiveElement.sourceMap = utils.concatSourceMaps(childSourceMaps);
      }
    }
  }

  processArray(arrayElement, node, context) {
    let curNode = node;
    const arrayMembers = arrayElement.content.members;

    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    const samples = [];
    const defaults = [];
    const predefinedType = arrayMembers.length ? arrayMembers[0].type : 'string';
    const hasComplexMembers = arrayElement.content.isComplex();

    const childSourceMaps = [];

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.SampleValueParser,
        this.Parsers.DefaultValueParser,
        this.Parsers.MSONMemberGroupParser,
        this.Parsers.MSONMixinParser,
        this.Parsers.ArrayMemberParser,
      ]);

      switch (sectionType) {
        case SectionTypes.sampleValue: {
          context.data.typeForSamples = 'array';
          context.data.valueType = predefinedType;
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          delete context.data.typeForSamples;
          delete context.data.valueType;
          if (!hasComplexMembers) {
            samples.push(...childResult);
            childResult.forEach(c => {
              childSourceMaps.push(...c.sourceMap);
            });
          } else {
            context.addWarning('Samples of arrays of non-primitive types are not supported', sourceMap);
          }
          break;
        }
        case SectionTypes.defaultValue: {
          context.data.typeForDefaults = 'array';
          context.data.valueType = predefinedType;
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          delete context.data.typeForDefaults;
          delete context.data.valueType;
          if (!hasComplexMembers) {
            defaults.push(...childResult);
            childResult.forEach(c => {
              childSourceMaps.push(...c.sourceMap);
            });
          } else {
            context.addWarning('Default values of arrays of non-primitive types are not supported', sourceMap);
          }
          break;
        }
        case SectionTypes.msonArrayMemberGroup: {
          [nextNode, childResult] = this.Parsers.MSONMemberGroupParser.parse(curNode, context);
          arrayMembers.push(...childResult.members);
          childSourceMaps.push(...childResult.members.map(c => c.sourceMap));
          break;
        }
        case SectionTypes.msonMixin: {
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);

          const isMixinValid = validateMixin(
            childResult,
            curNode,
            context,
            (mixinElement) => (mixinElement.isArray() ? [true, ''] : [false, 'arrays should contain array mixins']),
          );

          if (isMixinValid) {
            arrayMembers.push(childResult);
            childSourceMaps.push(childResult.sourceMap);
          }
          break;
        }
        case SectionTypes.arrayMember: {
          [nextNode, childResult] = this.Parsers.ArrayMemberParser.parse(curNode, context);
          arrayMembers.push(childResult);
          childSourceMaps.push(childResult.sourceMap);
          break;
        }
        default: {
          context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, sourceMap);
          const curNodeSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          arrayElement.unrecognizedBlocks.push(new UnrecognizedBlockElement(curNodeSourceMap));
          nextNode = utils.nextNode(curNode);
        }
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
      if (member instanceof MSONMixinElement) {
        // может быть ValueMemberElement или MSONMixinElement,
        // при этом MSONMixinElement вставляем "как есть"
        return;
      }

      if (!member.type && types.primitiveTypes.includes(predefinedType)) {
        member.type = predefinedType;
        const realValue = utilsHelpers.convertType(member.value, predefinedType);
        if (!realValue.valid) {
          context.addWarning(`Invalid value "${member.value}" for "${predefinedType}" type`, sourceMap);
        }
        member.value = realValue.valid ? realValue.value : utils.defaultValue(predefinedType);
      }
    });

    if (childSourceMaps.length) {
      if (arrayElement.sourceMap) {
        arrayElement.sourceMap = utils.concatSourceMaps([arrayElement.sourceMap, ...childSourceMaps]);
      } else {
        arrayElement.sourceMap = utils.concatSourceMaps(childSourceMaps);
      }
    }
  }

  processObject(valueMember, node, context) {
    const baseType = context.typeResolver.types[valueMember.type];
    if (baseType && baseType instanceof SchemaNamedTypeElement && !context.languageServerMode) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      throw new utils.CrafterError('No inheritance allowed from schema named type', sourceMap);
    }

    const objectElement = new ObjectElement();
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
        case SectionTypes.msonAttribute: {
          [nextNode, childResult] = this.Parsers.MSONAttributeParser.parse(curNode, context);

          const { value } = childResult;
          const isFixedOrFixedTypePropagated = value.propagatedTypeAttributes
            && (value.propagatedTypeAttributes.includes('fixed') || value.propagatedTypeAttributes.includes('fixedType'));
          const isFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedTypePropagated || value.typeAttributes.includes('fixed') || value.typeAttributes.includes('fixedType');

          const typeName = value.isArray() && value.nestedTypes[0] && value.nestedTypes[0].type || value.type;
          const typeEl = context.typeResolver.types[typeName];

          if (isFixedOrFixedType && typeEl && utils.typeIsUsedByElement(typeName, typeEl, context.typeResolver.types)) {
            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            throw new utils.CrafterError('Mson attributes based on a recursive type must not have "fixed" or "fixed-type" attributes', sourceMap);
          }
          break;
        }
        case SectionTypes.msonMixin: {
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);

          const isMixinValid = validateMixin(
            childResult,
            curNode,
            context,
            (mixinElement) => (mixinElement.isObject() ? [true, ''] : [false, 'objects should contain object mixins']),
          );

          if (!isMixinValid) {
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
          const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, sourceMap);
          valueMember.unrecognizedBlocks.push(new UnrecognizedBlockElement(sourceMap));
          nextNode = utils.nextNode(curNode);
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

    valueMember.content = objectElement;

    if (objectElement.propertyMembers.length) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const sourceMap = utils.mergeSourceMaps(objectElement.propertyMembers.map(pm => pm.sourceMap), sourceBuffer, linefeedOffsets);

      if (valueMember.sourceMap) {
        valueMember.sourceMap = utils.concatSourceMaps([valueMember.sourceMap, sourceMap]);
      } else {
        valueMember.sourceMap = sourceMap;
      }
    }
  }

  processEnum(valueMember, node, context) {
    const [, baseNestedTypes] = context.typeResolver.getStandardBaseAndNestedTypes(valueMember.type);
    const nestedTypesNames = valueMember.nestedTypes.map(nestedType => nestedType.type);
    const nestedTypes = Array.from(new Set([...nestedTypesNames, ...baseNestedTypes]));

    const enumElement = new EnumElement(nestedTypes.length ? nestedTypes : valueMember.nestedTypes);
    const sourceMap = utils.makeGenericSourceMap(this.valueMemberRootNode.parent, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    const samples = [];
    const defaults = [];
    const validEnumMemberTypes = EnumElement.validEnumMemberTypes;
    const hasComplexMembers = enumElement.isComplex();
    let curNode = node;
    const childSourceMaps = [];

    while (curNode) {
      let nextNode;
      let childResult;

      const sectionType = SectionTypes.calculateSectionType(curNode, context, [
        this.Parsers.MSONMemberGroupParser,
        this.Parsers.MSONMixinParser,
        this.Parsers.DefaultValueParser,
        this.Parsers.SampleValueParser,
        this.Parsers.EnumMemberParser,
      ]);

      switch (sectionType) {
        case SectionTypes.msonEnumMemberGroup:
          [nextNode, childResult] = this.Parsers.MSONMemberGroupParser.parse(curNode, context);
          enumElement.members.push(...childResult.members);
          childSourceMaps.push(...childResult.members.map(m => m.sourceMap));
          break;
        case SectionTypes.msonMixin: {
          [nextNode, childResult] = this.Parsers.MSONMixinParser.parse(curNode, context);

          const isMixinValid = validateMixin(
            childResult,
            curNode,
            context,
            (mixinElement) => (mixinElement.isEnum() ? [true, ''] : [false, 'enums should contain enum mixins']),
          );

          if (isMixinValid) {
            enumElement.members.push(childResult);
            childSourceMaps.push(childResult.sourceMap);
          }
          break;
        }
        case SectionTypes.defaultValue:
          context.data.typeForDefaults = 'enum';
          context.data.valueType = enumElement.type;
          [nextNode, childResult] = this.Parsers.DefaultValueParser.parse(curNode, context);
          delete context.data.typeForDefaults;
          delete context.data.valueType;
          if (!hasComplexMembers) {
            defaults.push(...childResult);
            childSourceMaps.push(...childResult.map(c => c.sourceMap));
          } else {
            context.addWarning('Default values of enum of non-primitive type are not supported', sourceMap);
          }
          break;
        case SectionTypes.sampleValue:
          context.data.typeForSamples = 'enum';
          context.data.valueType = enumElement.type;
          [nextNode, childResult] = this.Parsers.SampleValueParser.parse(curNode, context);
          delete context.data.typeForSamples;
          delete context.data.valueType;
          if (!hasComplexMembers) {
            samples.push(...childResult);
            childSourceMaps.push(...childResult.map(c => c.sourceMap));
          } else {
            context.addWarning('Samples of enum of non-primitive type are not supported', sourceMap);
          }
          break;
        case SectionTypes.enumMember:
          [nextNode, childResult] = this.Parsers.EnumMemberParser.parse(curNode, context);
          if (childResult.value) {
            if (!childResult.type || validEnumMemberTypes.includes(childResult.type)) {
              enumElement.members.push(childResult);
              childSourceMaps.push(childResult.sourceMap);
            } else {
              context.addWarning(`Invalid enum member type: ${childResult.type}. Valid types: ${validEnumMemberTypes.join(', ')}.`, childResult.sourceMap);
            }
          } else {
            context.addWarning(`Enum members must have names: ${childResult.type}`, childResult.sourceMap);
          }
          break;
        case SectionTypes.msonArrayMemberGroup: {
          const errorSourceMap = utils.makeGenericSourceMap(curNode.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          throw new utils.CrafterError('Enums must use "Members" instead of "Items" as member section name', errorSourceMap);
        }
        default: {
          const errorSourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, errorSourceMap);
          valueMember.unrecognizedBlocks.push(new UnrecognizedBlockElement(errorSourceMap));
          nextNode = utils.nextNode(curNode);
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

    if (hasComplexMembers) {
      context.addWarning('Enum must not use non-primitive or named types as a sub-type. Sub-type "string" will be used instead.', sourceMap);
      enumElement.type = 'string';
    }

    enumElement.members.forEach((member) => {
      if (member instanceof MSONMixinElement) {
        // может быть EnumMemberElement или MSONMixinElement,
        // при этом MSONMixinElement вставляем "как есть"
        return;
      }

      const converted = utilsHelpers.convertType(member.value, enumElement.type);
      const typesMatch = utils.compareAttributeTypes(enumElement, member);

      if (!typesMatch) {
        context.addTypeMismatchWarning(member.value, enumElement.type, sourceMap);
      }

      member.value = converted.valid ? converted.value : utils.defaultValue(enumElement.type);

      if (!member.type) member.type = enumElement.type;
    });

    if (childSourceMaps.length) {
      if (valueMember.sourceMap) {
        valueMember.sourceMap = utils.concatSourceMaps([valueMember.sourceMap, ...childSourceMaps]);
      } else {
        valueMember.sourceMap = utils.concatSourceMaps(childSourceMaps);
      }
    }

    valueMember.content = enumElement;
  }
}

module.exports = DataStructureProcessor;

function validateMixin(mixinElement, curNode, context, checkMixinType) {
  if (context.languageServerMode) return true;

  const baseType = context.typeResolver.types[mixinElement.className];

  if (!baseType) return true;

  if (!baseType.isComplex()) {
    const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    context.addWarning('Mixin may not include a type of a primitive sub-type', sourceMap);
    return false;
  }

  if (baseType instanceof SchemaNamedTypeElement) {
    const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    throw new utils.CrafterError('Mixin may not include a schema named type', sourceMap);
  }

  const [typeCheckPassed, typeCheckDetails] = checkMixinType(baseType);

  if (!typeCheckPassed) {
    const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    throw new utils.CrafterError(`Mixin base type should be the same as parent base type: ${typeCheckDetails}.`, sourceMap);
  }
  return true;
}
