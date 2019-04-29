const Refract = require('../../Refract');
const utils = require('../../utils');
const types = require('../../types');

const { convertType } = utils;

class ValueMemberElement {
  constructor(type, typeAttributes = [], value, description, isSample, isDefault) {
    const resolvedType = type ? utils.resolveType(type) : { type, nestedTypes: [] };

    this.rawType = type;
    this.type = resolvedType.type;
    this.nestedTypes = resolvedType.nestedTypes;
    this.baseType = null;
    this.typeAttributes = typeAttributes;
    this.value = convertType(value, this.type).value;
    this.description = description;
    this.content = null;
    this.samples = null;
    this.default = null;
    this.sourceMap = null;
    this.isSample = isSample;
    this.isDefault = isDefault;
  }

  isObject() {
    return !types.nonObjectTypes.includes(this.type) && !types.nonObjectTypes.includes(this.baseType);
  }

  isArray() {
    return this.type === types.array || this.baseType === types.array;
  }

  isEnum() {
    return this.type === types.enum || this.baseType === types.enum;
  }

  isComplex() {
    return !types.primitiveTypes.includes(this.baseType || this.type);
  }

  isStandardType() {
    return types.standardTypes.includes(this.type) || !this.type;
  }

  isType(type) {
    return (this.baseType === type || this.type === type);
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

    if (this.value != null) { // проверяем null | undefined, разрешаем false
      result.content = this.value;
    }

    if (this.content) {
      if (this.isEnum()) {
        result.attributes = this.content.toRefract();
      } else {
        result.content = this.content.toRefract();
      }
    }

    if (this.samples || this.default || this.sourceMap) {
      if (!result.attributes) result.attributes = {};
    }

    if (this.samples) {
      const existingSamplesContent = (result.attributes.samples && result.attributes.samples.content) || [];
      const samplesContent = [
        ...(this.samples.map(sampleElement => sampleElement.toRefract())),
        ...existingSamplesContent,
      ];

      result.attributes.samples = {
        element: Refract.elements.array,
        content: samplesContent,
      };
    }

    if (this.default) {
      result.attributes.default = this.default.toRefract();
    }

    if (result.content == null || result.content === '' || (Array.isArray(result.content) && !result.content[0])) {
      delete result.content;
    }

    if (this.sourceMap) {
      result.attributes.sourceMap = this.sourceMap.toRefract();
    }

    return result;
  }

  getBody(resolvedTypes) {
    let body = {};
    const type = this.type || (this.content ? 'object' : 'string');
    const value = convertType(this.value, type).value || utils.defaultValue(type);
    const isEmpty = (localBody) => (Object.keys(localBody).length === 0);
    const hasSamples = this.samples && this.samples.length;

    const typeEl = resolvedTypes[this.type];
    if (typeEl) {
      if (typeEl.isComplex()) {
        body = typeEl.content.getBody(resolvedTypes);
      } else {
        body.value = utils.defaultValue(typeEl.baseType);
      }
    }

    if (this.content) {
      if (body.value && this.isArray()) {
        body.value.push(...this.content.getBody(resolvedTypes, { hasSamples }).value);
      } else {
        body = utils.mergeBodies(body, this.content.getBody(resolvedTypes, { hasSamples }));
      }
    }

    if (hasSamples) {
      const sampleBody = this.samples[0].getBody(resolvedTypes);
      if (Array.isArray(body.value)) {
        body.value.push(...sampleBody);
      } else if (isEmpty(body)) {
        body.value = sampleBody[0];
      }
    }

    if (this.default) {
      const defaultMembers = this.default.getBody(resolvedTypes);
      if (Array.isArray(body.value)) {
        body.value = defaultMembers;
      } else if (this.isObject()) {
        body.value = defaultMembers.reduce((acc, val) => {
          acc = utils.mergeBodies(acc, val);
          return acc;
        }, {});
      } else if (isEmpty(body)) {
        body.value = defaultMembers[0];
      }
    }

    if (isEmpty(body)) {
      body.value = value;
    }

    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = {};

    const typeEl = resolvedTypes[this.type];
    if (typeEl) {
      if (typeEl.isComplex()) {
        schema = typeEl.content.getSchema(resolvedTypes, utils.mergeFlags(flags, typeEl));
        schema = fillSchemaWithAttributes(schema, typeEl.typeAttributes);
      } else {
        schema.type = typeEl.baseType;
        schema = fillSchemaWithAttributes(schema, typeEl.typeAttributes);
      }
    }

    if (this.content) {
      schema = utils.mergeSchemas(schema, this.content.getSchema(resolvedTypes, flags));
    }

    if (this.default) {
      const defaultMembers = this.default.getSchema(resolvedTypes);
      if (this.isArray()) {
        schema.default = defaultMembers;
      } else if (this.isObject()) {
        schema.default = defaultMembers.reduce((acc, val) => {
          acc = utils.mergeSchemas(acc, val);
          return acc;
        }, {});
      } else {
        schema.default = defaultMembers[0];
      }
    }

    if (this.isArray()) {
      fillSchemaWithAttributes(schema, this.typeAttributes);
    }

    if (typeEl || this.content) {
      return schema;
    }

    if (!this.type) {
      this.type = 'string';
    }

    // Нормализуем тип, так как в json schema не сущетсвует типа 'file'
    const normalizedType = (this.type === 'file') ? 'string' : this.type;

    if (flags.isNullable) {
      schema.type = [
        normalizedType,
        'null',
      ];
    } else {
      schema.type = normalizedType;
    }

    if (flags.isFixed && !this.isSample && this.value != null) {
      schema.enum = [this.value];
    }

    if (this.type === 'file') {
      schema.contentEncoding = 'base64';
    }

    fillSchemaWithAttributes(schema, this.typeAttributes);

    return schema;
  }
}

function fillSchemaWithAttributes(schema, typeAttributes) {
  const parameterizedAttributes = {
    string: {
      pattern: 'pattern',
      format: 'format',
      minLength: 'minLength',
      maxLength: 'maxLength',
    },
    array: {
      minLength: 'minItems',
      maxLength: 'maxItems',
    },
  };

  const allowedAttributes = parameterizedAttributes[schema.type];
  if (allowedAttributes === undefined) return schema;

  typeAttributes.forEach(a => {
    if (!Array.isArray(a)) return;
    const attrName = allowedAttributes[a[0]];
    if (attrName) {
      schema[attrName] = a[1];
    }
  });

  return schema;
}

module.exports = ValueMemberElement;
