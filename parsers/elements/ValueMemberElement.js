const Refract = require('../../Refract');
const utils = require('../../utils');
const types = require('../../types');
const SourceMapElement = require('./SourceMapElement');

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

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;
    const type = this.type || (this.content ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
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
        result.attributes = this.content.toRefract(sourceMapsEnabled);
      } else {
        result.content = this.content.toRefract(sourceMapsEnabled);
      }
    }

    if (this.samples || this.default || sourceMapEl) {
      if (!result.attributes) result.attributes = {};
    }

    if (this.samples) {
      const existingSamplesContent = (result.attributes.samples && result.attributes.samples.content) || [];
      const samplesContent = [
        ...(this.samples.map(sampleElement => sampleElement.toRefract(sourceMapsEnabled))),
        ...existingSamplesContent,
      ];

      result.attributes.samples = {
        element: Refract.elements.array,
        content: samplesContent,
      };
    }

    if (this.default) {
      result.attributes.default = this.default.toRefract(sourceMapsEnabled);
    }

    if (result.content == null || result.content === '' || (Array.isArray(result.content) && !result.content[0])) {
      delete result.content;
    }

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  getBody(resolvedTypes) {
    if (this.samples && this.samples.length) {
      return this.samples[0].getBody(resolvedTypes);
    }

    if (this.default) {
      return this.default.getBody(resolvedTypes);
    }

    let body;

    const typeEl = resolvedTypes[this.type];
    if (typeEl && typeEl.isComplex()) {
      body = typeEl.getBody(resolvedTypes);
    }

    if (this.content) {
      body = mergeBodies(body, this.content.getBody(resolvedTypes));
    }

    if (body !== undefined) {
      return body;
    }

    const type = (typeEl && typeEl.baseType) || this.type || (this.content ? 'object' : 'string');
    const convertedValue = convertType(this.value, type).value;
    return convertedValue !== undefined && convertedValue !== null ? convertedValue : utils.defaultValue(type);
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = {};

    const typeEl = resolvedTypes[this.type];
    if (typeEl) {
      if (typeEl.isComplex()) {
        schema = typeEl.getSchema(resolvedTypes, typeEl.typeAttributes && utils.mergeFlags(flags, typeEl));
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
      schema.default = this.default.value;
    }

    if (this.isArray()) {
      fillSchemaWithAttributes(schema, this.typeAttributes);
    }

    if (!this.type && !(typeEl || this.content)) {
      this.type = 'string';
    }

    // Нормализуем тип, так как в json schema не сущетсвует типа 'file'
    const normalizedType = (this.type === 'file') ? 'string' : schema.type || this.type;

    if (flags.isNullable) {
      schema.type = [
        normalizedType,
        'null',
      ];

      if (schema.enum) schema.enum = [...schema.enum, null];
    } else {
      schema.type = normalizedType;
    }

    if (typeEl || this.content) {
      return schema;
    }

    if (flags.isFixed && !this.isSample && this.value != null) {
      schema.enum = [this.value];
    }

    if ((flags.isFixed || flags.isFixedType) && this.isObject()) {
      schema.additionalProperties = false;
    }

    if (this.type === 'file') {
      schema.contentEncoding = 'base64';
    }

    fillSchemaWithAttributes(schema, this.typeAttributes);

    return schema;
  }
}

function fillSchemaWithAttributes(schema, typeAttributes) {
  if (!typeAttributes) return schema;

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
    number: {
      minimum: 'minimum',
      maximum: 'maximum',
    },
  };

  const allowedAttributes = parameterizedAttributes[schema.type];
  if (!allowedAttributes) return schema;

  typeAttributes.forEach(a => {
    if (!Array.isArray(a)) return;
    const attrName = allowedAttributes[a[0]];
    if (attrName) {
      schema[attrName] = a[1];
    }
  });

  return schema;
}

function mergeBodies(body1, body2) {
  if (body1 === undefined) return body2;
  if (body2 === undefined) return body1;

  if (Array.isArray(body1) && Array.isArray(body2)) {
    return [...body1, ...body2];
  }

  if (typeof body1 === 'object' && typeof body2 === 'object') {
    return { ...body1, ...body2 };
  }

  return body2;
}

module.exports = ValueMemberElement;
