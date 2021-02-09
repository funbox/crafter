const Refract = require('../../Refract');
const utils = require('../../utils');
const types = require('../../types');
const SourceMapElement = require('./SourceMapElement');
const Flags = require('../../Flags');

/**
 * Краеугольный камень многих структур данных в Crafter.
 * ValueMemberElement может быть телом именованного типа, поля объекта, типом элементов массива или вариантом из One Of.
 *
 * Примеры:
 *
 * исходный текст:
 * + Attributes (string)
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *
 * исходный текст:
 * + Attributes
 *   + name (string)
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement
 *       propertyMembers:
 *         - PropertyMemberElement
 *           value: ValueMemberElement
 *
 */
class ValueMemberElement {
  /**
   * @param {string} rawType - тип данных, например string, array[number] или User
   * @param {string} type - обработанный тип данных без вложенных типов, например string, array или User
   * @param {ValueMemberElement[]} nestedTypes - типы элементов массива или enum
   * @param {(string|Array)[]} typeAttributes - набор атрибутов типа fixed, nullable, ["minimum", 10]
   * @param {string} value - значение элемента, в зависимости от атрибутов может интерпретироваться как непосредственное значение или пример
   * @param {StringElement} description - описание элемента
   * @param {boolean} isSample - является ли данный элемент примером
   * @param {boolean} isDefault - является ли данный элемент элементом по умолчанию
   */
  constructor(rawType, type, nestedTypes = [], typeAttributes = [], value, description, isSample, isDefault) {
    this.rawType = rawType;
    this.type = type;
    /**
     * Типы элементов массива array[string, number]: тут string и number — это nestedTypes
     */
    this.nestedTypes = nestedTypes;
    /**
     * Один из базовых типов данных, который определяет текущий элемент непосредственно или путем наследования.
     * Базовые типы определены в types.js в корне проекта.
     * @type {string}
     */
    this.baseType = undefined;
    this.typeAttributes = typeAttributes;
    this.value = value;
    this.description = description;
    /**
     *
     * Поле заполняется в методе fillBaseType класса ValueMemberProcessor.
     * @type {string[]}
     */
    this.propagatedTypeAttributes = [];
    /**
     * Поле заполняется методом fillValueMember класса DataStructureProcessor для объектов и enum-ов
     * и в методе fillBaseType класса ValueMemberProcessor для массивов.
     * @type {ObjectElement|EnumElement|ArrayElement}
     */
    this.content = null;
    /**
     * @type {SampleValueElement[]}
     */
    this.samples = [];
    /**
     * @type {DefaultValueElement}
     */
    this.default = null;
    this.isSample = isSample;
    this.isDefault = isDefault;
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    /**
     * @type {SourceMap}
     */
    this.sourceMap = null;
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
    return isStandardType(this.type);
  }

  isType(type) {
    return (this.baseType === type || this.type === type);
  }

  getType() {
    return this.type || (this.content ? 'object' : 'string');
  }

  getBaseType() {
    return this.baseType || this.getType();
  }

  isRecursive(typesChain) {
    if (this.isObject() && typesChain.includes(this.type)) return true;

    if (typesChain.length < 2) return false;

    const lastAddedType = typesChain[typesChain.length - 1];
    const firstOccurrence = typesChain.indexOf(lastAddedType);

    return firstOccurrence !== typesChain.length - 1;
  }

  shouldOutputSamples(isFixed) {
    return (this.isSample || !((this.isObject() && this.content) || this.isDefault || isFixed)) && this.samples.length > 0;
  }

  shouldOutputValue(isFixed) {
    const notEmpty = this.value != null; // проверяем null | undefined, разрешаем false
    return !((this.type && this.isObject()) || this.shouldOutputSamples(isFixed) || this.default) && notEmpty;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов, влияет на результирующий AST
   */
  toRefract(sourceMapsEnabled, isFixed) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;
    const type = this.getType();

    const result = {
      element: type,
    };

    if (this.description) {
      result.meta = {
        description: this.description.toRefract(sourceMapsEnabled),
      };
    }

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.shouldOutputValue(isFixed)) {
      result.content = this.value;
    }

    if (this.content) {
      if (this.isEnum()) {
        result.attributes = this.content.toRefract(sourceMapsEnabled);
      } else {
        result.content = this.content.toRefract(sourceMapsEnabled, isFixed || this.typeAttributes.includes('fixed') || this.propagatedTypeAttributes.includes('fixed'));
      }
    }

    if (this.shouldOutputSamples(isFixed) || this.default || sourceMapEl) {
      if (!result.attributes) result.attributes = {};
    }

    if (this.shouldOutputSamples(isFixed)) {
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

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
   */
  getBody(dataTypes, namedTypesChain = []) {
    if (this.shouldOutputSamples()) {
      return this.samples[0].getBody(dataTypes);
    }

    if (this.default) {
      return this.default.getBody(dataTypes);
    }

    let body;

    const typeEl = dataTypes[this.type];

    if (this.isObject() && this.isRecursive(namedTypesChain)) {
      const recursiveTypeEl = dataTypes[namedTypesChain[namedTypesChain.length - 1]];
      const propertyMember = recursiveTypeEl.content.propertyMembers.find(pm => (
        pm.value && (pm.value.type === this.type || !!pm.value.nestedTypes.find(nestedType => nestedType.type === this.type))
      ));

      if (propertyMember) {
        const { typeAttributes } = propertyMember;

        if (typeAttributes.includes('nullable')) {
          return null;
        }
      }


      const recursionDepth = getRecursionDepth(namedTypesChain);

      if (namedTypesChain[namedTypesChain.length - recursionDepth] === this.type) {
        return undefined;
      }
    }

    if (typeEl && typeEl.isComplex()) {
      body = typeEl.getBody(dataTypes, namedTypesChain.concat(this.type));
    }

    if (this.content) {
      if (this.isArray() && this.isRecursive(namedTypesChain)) {
        return [];
      }

      body = mergeBodies(body, this.content.getBody(dataTypes, namedTypesChain));
    }

    if (body !== undefined) {
      return body;
    }

    const type = (typeEl && typeEl.baseType) || this.type || (this.content ? 'object' : 'string');
    const valueToReturn = this.shouldOutputValue() ? this.value : null;
    return valueToReturn !== undefined && valueToReturn !== null ? valueToReturn : utils.defaultValue(type);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   * @param {string[]} namedTypesChain - использованные в процессе генерации schema именованные типы, нужны для отслеживания рекурсивных структур
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    let schema = {};
    let schemaRef = null;
    let usedTypes = [];

    const typeEl = dataTypes[this.type];
    if (typeEl) {
      if (typeEl.isComplex()) {
        if (flags.skipTypesInlining || this.isRecursive(namedTypesChain)) {
          const $ref = `#/definitions/${this.type}`;
          schema = flags.isNullable
            ? { oneOf: [{ $ref }, { type: 'null' }] }
            : { $ref };
          schemaRef = $ref;
          usedTypes = [this.type];
        } else {
          [schema, usedTypes] = typeEl.getSchema(dataTypes, typeEl.typeAttributes && utils.mergeFlags(flags, typeEl), namedTypesChain.concat(this.type));
        }
        schema = fillSchemaWithAttributes(schema, typeEl.typeAttributes);
      } else {
        schema.type = typeEl.baseType;
        schema = fillSchemaWithAttributes(schema, typeEl.typeAttributes);
      }
    }

    if (this.content) {
      // TODO Есть подозрение, что этот код не нужен: он используется только для массивов, но для них и так выставляется skipTypesInlining
      const nestedTypes = this.nestedTypes.map(nt => nt.type);
      const namedTypes = nestedTypes.concat(this.type).filter(t => !isStandardType(t));
      const newTypesChain = namedTypesChain.concat(namedTypes);

      const [contentSchema, contentUsedTypes] = this.content.getSchema(dataTypes, utils.mergeFlags(flags, this), newTypesChain);
      usedTypes.push(...contentUsedTypes);

      if (!schemaRef) {
        if (typeEl) {
          schema = accountPrecedence(schema, typeEl, this.content);
        }
        schema = utils.mergeSchemas(schema, contentSchema);
      } else if (!this.isRecursive(namedTypesChain)) {
        if (this.isObject()) {
          const localFlags = utils.mergeFlags(flags, this);
          const [typeElSchema, typeElUsedTypes] = typeEl.getSchema(dataTypes, utils.mergeFlags(localFlags, typeEl), newTypesChain);

          schema = utils.mergeSchemas(typeElSchema, contentSchema);
          schema = fillSchemaWithAttributes(schema, typeEl.typeAttributes);
          schema = accountPrecedence(schema, typeEl, this.content);

          usedTypes.push(...typeElUsedTypes);
        }
        if (this.isEnum()) {
          schema = { anyOf: [{ $ref: schemaRef }, contentSchema] };
        }
      }
    }

    if (this.default) {
      schema.default = this.default.value;
    }

    if (this.isArray()) {
      fillSchemaWithAttributes(schema, this.typeAttributes);
    }

    if (!this.type && !(typeEl || this.content)) {
      schema.type = 'string';
    }

    // Нормализуем тип, так как в json schema не сущетсвует типа 'file'
    const normalizedType = (this.type === 'file') ? 'string' : schema.type || (this.baseType === 'object' ? this.baseType : this.type);

    if (!schemaRef) {
      schema.type = flags.isNullable ? [normalizedType, 'null'] : normalizedType;
      if (schema.enum && flags.isNullable) {
        schema.enum = [...schema.enum, null];
      }
    }

    if (typeEl || this.content) {
      return [schema, usedTypes];
    }

    if (flags.isFixed && !this.isSample && this.value != null) {
      schema.enum = flags.isNullable ? [this.value, null] : [this.value];
    }

    if ((flags.isFixed || flags.isFixedType) && !types.nonObjectTypes.includes(schema.type)) {
      schema.additionalProperties = false;
    }

    if (this.type === 'file') {
      schema.contentEncoding = 'base64';
    }

    fillSchemaWithAttributes(schema, this.typeAttributes);

    return [schema, usedTypes];
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

function isStandardType(type) {
  return types.standardTypes.includes(type) || !type;
}

function getRecursionDepth(namedTypesChain) {
  for (let i = namedTypesChain.length - 1; i > 0; i--) {
    const lastIndex = namedTypesChain.lastIndexOf(namedTypesChain[i], i - 1);
    if (lastIndex > -1) return i - lastIndex;
  }

  return 0;
}

/**
 *
 * @param {Object} schema
 * @param {ValueMemberElement} typeEl
 * @param {ObjectElement|EnumElement|ArrayElement} content
 * @return {Object}
 */
function accountPrecedence(schema, typeEl, content) {
  if (schema.type !== 'object') {
    return schema;
  }
  const schemaRequiredProperties = schema.required || [];
  const contentOptionalProperties = content.getOptionalMembers().map(member => member.name.string);
  const contentRequiredProperties = content.getRequiredMembers().map(member => member.name.string);

  delete schema.required;

  const updatedSchemaRequiredProperties = schemaRequiredProperties
    .filter(prop => !contentOptionalProperties.includes(prop))
    .concat(contentRequiredProperties);

  if (updatedSchemaRequiredProperties.length > 0) {
    schema.required = [...new Set(updatedSchemaRequiredProperties)];
  }

  return schema;
}

module.exports = ValueMemberElement;
