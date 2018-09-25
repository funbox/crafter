const Refract = require('../../Refract');
const utils = require('../../utils');
const types = require('../../types');
const { splitValues } = require('../../SignatureParser');
const ArrayElement = require('./ArrayElement');
const SampleValueElement = require('./SampleValueElement');

class ValueMemberElement {
  constructor(type, typeAttributes = [], value, description, isSample) {
    const resolvedType = utils.resolveType(type);

    this.rawType = type;
    this.type = resolvedType.type;
    this.typeAttributes = typeAttributes;
    this.value = value;
    this.description = description;
    this.content = null;
    this.samples = null;

    if (this.isArray()) {
      let members = resolvedType.nestedTypes.map(t => new ValueMemberElement(t));
      let sampleElement;

      if (this.value) {
        const inlineValues = splitValues(this.value);
        const inlineValuesType = resolvedType.nestedTypes.length === 1 ? resolvedType.nestedTypes[0] : 'string';
        const inlineMembers = inlineValues.map(val => new ValueMemberElement(inlineValuesType, [], val));
        sampleElement = new SampleValueElement(inlineValues, inlineValuesType);
        members = members.length === 1 ? inlineMembers : inlineMembers.concat(members);
      }

      if (isSample && !!sampleElement) {
        this.samples = [sampleElement];
        this.value = null;
      } else {
        this.content = new ArrayElement(members);
      }
    }
  }

  isObject() {
    return !types.nonObjectTypes.includes(this.type);
  }

  isArray() {
    return this.type === types.array;
  }

  isEnum() {
    return this.type === types.enum;
  }

  isComplex() {
    return !types.primitiveTypes.includes(this.type);
  }

  toRefract() {
    const type = this.type || (this.content ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.description && !this.isObject()) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
        },
      };
    }

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.samples) {
      if (!result.attributes) result.attributes = {};

      result.attributes.samples = {
        element: Refract.elements.array,
        content: this.samples.map(sampleElement => ({
          element: type,
          content: sampleElement.toRefract(),
        })),
      };
    }

    if (this.value) {
      result.content = this.value;
    }

    if (this.content) {
      if (this.isEnum()) {
        result.attributes = this.content.toRefract();
      } else {
        result.content = this.content.toRefract();
      }
    }

    if (!result.content || !result.content[0]) {
      delete result.content;
    }

    return result;
  }
}

module.exports = ValueMemberElement;
