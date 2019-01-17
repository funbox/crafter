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
    this.sourceMap = null;
    this.isSample = isSample;

    if (this.isArray()) {
      const members = resolvedType.nestedTypes.map(t => new ValueMemberElement(t));

      this.content = new ArrayElement(members);

      if (this.value) {
        const inlineValues = splitValues(this.value);
        const inlineValuesType = resolvedType.nestedTypes.length === 1 ? resolvedType.nestedTypes[0] : 'string';
        const sampleElement = new SampleValueElement(inlineValues, inlineValuesType);
        this.samples = [sampleElement];
        this.value = null;
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

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract() },
          } : {}),
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

    if (this.sourceMap) {
      if (!result.attributes) result.attributes = {};
      result.attributes.sourceMap = this.sourceMap.toRefract();
    }

    return result;
  }

  getBody(resolvedTypes) {
    let body = {};
    const type = this.type || (this.content ? 'object' : 'string');
    const value = this.value || defaultValue(type);

    const typeEl = resolvedTypes[this.type];
    if (typeEl) {
      body = typeEl.content.getBody(resolvedTypes);
    }

    if (this.content) {
      body = utils.mergeBodies(body, this.content.getBody(resolvedTypes));
    }

    if (Array.isArray(body.value) && this.samples && this.samples.length) {
      const sampleBody = this.samples[0].getBody();
      body.value.push(...sampleBody);
    }

    if (Object.keys(body).length === 0) {
      body.value = value;
    }

    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = {};

    const typeEl = resolvedTypes[this.type];
    if (typeEl) {
      schema = typeEl.content.getSchema(resolvedTypes, flags);
    }

    if (this.content) {
      schema = utils.mergeSchemas(schema, this.content.getSchema(resolvedTypes, flags));
    }

    if (typeEl || this.content) {
      return schema;
    }

    const type = (!this.type || this.type === 'file') ? 'string' : this.type;

    if (flags.isNullable) {
      schema.type = [
        type,
        'null',
      ];
    } else {
      schema.type = type;
    }

    if (this.type === 'file') {
      schema.contentEncoding = 'base64';
    }

    if (flags.isFixed && !this.isSample) {
      schema.enum = [this.value];
    }

    return schema;
  }
}

function defaultValue(type) {
  const valueByType = {
    boolean: false,
    number: 0,
    string: '',
    array: [],
    object: {},
    file: '',
    enum: null,
  };
  return valueByType[type] === undefined ? '' : valueByType[type];
}

module.exports = ValueMemberElement;
