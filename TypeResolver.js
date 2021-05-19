const MSONMixinElement = require('./parsers/elements/MSONMixinElement');
const PropertyMemberElement = require('./parsers/elements/PropertyMemberElement');

const { types } = require('./constants');
const utils = require('./utils');

const CrafterError = utils.CrafterError;

/**
 * Отвечает за извлечение и разбор именованных типов данных из Element AST
 */
class TypeResolver {
  constructor() {
    /** @typedef {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} DataTypes */

    /**
     * Содержит элементы - тела именованных типов
     * @type {DataTypes}
     */
    this.types = {};
    /**
     * Содержит названия именованных типов
     * @type {Object.<string, StringElement>}
     */
    this.typeNames = {};

    /**
     * Содержит названия файлов, в которых определён тот или иной именованнный тип
     * @type {Object.<string, string>}
     */
    this.typeLocations = {};
  }

  extendWith(externalResolver) {
    const [isValid, errorText] = validateResolver(externalResolver);

    if (!isValid) {
      throw new Error(`Failed to extend type resolver: ${errorText}`);
    }

    Object.entries(externalResolver.typeLocations).forEach(([name, location]) => {
      const existingLocation = this.typeLocations[name];
      if (existingLocation !== undefined && existingLocation !== location) {
        throw new CrafterError(`Type "${name}" already defined in ${existingLocation}`);
      }

      if (existingLocation === undefined) {
        this.typeLocations[name] = location;
      }
    });

    Object.entries(externalResolver.types).forEach(([name, type]) => {
      if (this.types[name] === undefined) {
        this.types[name] = type;
      }
    });

    Object.entries(externalResolver.typeNames).forEach(([name, nameElement]) => {
      if (this.typeNames[name] === undefined) {
        this.typeNames[name] = nameElement;
      }
    });
  }

  registerType(type, content, typeLocation) {
    this.types[type.name.string] = content;
    this.typeNames[type.name.string] = type.name;
    this.typeLocations[type.name.string] = typeLocation;
  }

  checkRegisteredTypes() {
    const resolvedTypes = new Set();
    /**
     * @param {string} name - название текущего обрабатываемого именованного типа
     * @param {ValueMemberElement|SchemaNamedTypeElement} targetType - элемент-тело именованного типа
     * @param {string[]} usedTypes - названия типов, ранее использованных в этой же цепочке разбора типов
     * @param {string[]} ignoredTypes - названия типов, которые будут проигнорированы в текущей цепочке разбора типов
     * @param {boolean} propertyWithContent - признак наличия вложенных свойств именованного типа
     */
    const resolveType = (name, targetType, usedTypes = [], ignoredTypes = [], propertyWithContent = false) => {
      const includedMixins = getIncludedMixins(targetType);

      if (usedTypes.includes(name)) {
        if (propertyWithContent) {
          throw new CrafterError(`Recursive named type ${name} must not include nested properties`, this.typeNames[name].sourceMap);
        }

        if (includedMixins.some(mixinElement => usedTypes.includes(mixinElement.className))) {
          throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`, this.typeNames[name].sourceMap);
        }

        const { typeAttributes } = targetType;
        if (typeAttributes.includes('nullable') || !typeAttributes.includes('required')) {
          return;
        }

        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`, this.typeNames[name].sourceMap);
      }

      if (resolvedTypes.has(name) || ignoredTypes.includes(name)) {
        return;
      }

      usedTypes.push(name);

      const baseTypeName = targetType.type;

      if (baseTypeName && types.standardTypes.indexOf(baseTypeName) === -1) {
        const baseType = this.types[baseTypeName];

        resolveType(baseTypeName, baseType, usedTypes);
      }

      includedMixins.forEach((mixin) => {
        const mixinName = mixin.className;
        const baseType = this.types[mixinName];

        this.checkMixinExists(mixin);

        if (mixinName === name) {
          throw new CrafterError(`Base type '${name}' circularly referencing itself`, mixin.sourceMap);
        }

        resolveType(mixinName, baseType, usedTypes);
      });

      if (targetType.content) {
        if (targetType.content.propertyMembers) {
          targetType.content.propertyMembers.forEach(member => {
            if (member.value) {
              if (member.value.type) {
                if (this.types[member.value.type]) {
                  resolveType(member.value.type, this.types[member.value.type], usedTypes, [], !!member.value.content);
                }
              }
              if (member.value.nestedTypes) {
                member.value.nestedTypes.forEach(({ type }) => {
                  if (this.types[type]) {
                    resolveType(type, this.types[type], [], usedTypes);
                  }
                });
              }
            }
          });
        }
        if (targetType.content.members) {
          targetType.content.members.forEach(member => {
            if (this.types[member.type]) {
              resolveType(member.type, this.types[member.type], usedTypes);
            }
          });
        }
      }

      resolvedTypes.add(name);
    };

    Object.entries(this.types).forEach(([name, valueMember]) => {
      resolveType(name, valueMember);
    });
  }

  /**
   * @param {MSONMixinElement} mixin - элемент с описанием миксина
   */
  checkMixinExists(mixin) {
    if (!Object.prototype.hasOwnProperty.call(this.types, mixin.className)) {
      throw new CrafterError(`Mixin "${mixin.className}" is not defined in the document.`, mixin.sourceMap);
    }
  }

  /**
   * @param {ValueMemberElement} target - элемент-тело именованного типа
   */
  checkUsedMixins(target) {
    const includedMixins = getIncludedMixins(target);
    const checkMixinExists = this.checkMixinExists.bind(this);

    includedMixins.forEach((mixin) => {
      checkMixinExists(mixin);
    });
  }

  /**
   * @param {string} typeName - название именованного типа
   */
  getStandardBaseType(typeName) {
    const [baseType] = this.getStandardBaseAndNestedTypes(typeName);

    return baseType;
  }

  /**
   * @param {string} typeName - название именованного типа
   */
  getStandardBaseAndNestedTypes(typeName) {
    const usedTypes = [];

    const getBaseType = (name) => {
      if (usedTypes.includes(name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`, this.typeNames[name].sourceMap);
      }

      usedTypes.push(name);

      try {
        name = this.types[name].type;
      } catch (e) {
        throw new CrafterError(`Type "${name}" not found`);
      }

      if (name && !types.standardTypes.includes(name)) {
        return getBaseType(name);
      }

      const resolvedTypeName = usedTypes[usedTypes.length - 1];
      const resolvedType = this.types[resolvedTypeName];
      return [name, (resolvedType.nestedTypes || []).map(({ type }) => type)];
    };

    if (types.standardTypes.includes(typeName)) {
      return [typeName, []];
    }

    const [baseType, nestedTypes] = getBaseType(typeName);
    return [baseType || types.object, nestedTypes];
  }
}

/**
 * @param {ValueMemberElement} target - элемент-тело именованного типа, для которого определяются используемые миксины
 */
function getIncludedMixins(target) {
  const includedMixins = [];

  const processValueElement = (tgt) => {
    if (!tgt.content || !tgt.content.propertyMembers) return;

    const res = tgt.content.propertyMembers.filter((member) => {
      if (member instanceof PropertyMemberElement) {
        processValueElement(member.value);
      }
      return member instanceof MSONMixinElement;
    });

    includedMixins.push(...res);
  };

  processValueElement(target);

  return includedMixins;
}

function validateResolver(resolver) {
  if (typeof resolver !== 'object') {
    return [false, 'resolver should be an object'];
  }

  if ([resolver.types, resolver.typeNames, resolver.typeLocations].some(field => (typeof field !== 'object'))) {
    return [false, 'resolver should have a valid form'];
  }

  return [true];
}

module.exports = TypeResolver;
