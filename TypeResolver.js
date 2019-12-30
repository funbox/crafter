const types = require('./types');
const standardTypes = require('./types').standardTypes;
const MSONMixinElement = require('./parsers/elements/MSONMixinElement');
const PropertyMemberElement = require('./parsers/elements/PropertyMemberElement');
const utils = require('./utils');

const CrafterError = utils.CrafterError;

class TypeResolver {
  constructor() {
    /** @typedef {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} DataTypes */

    /**
     * @type {DataTypes}
     */
    this.types = {};
    this.typeNames = {};
  }

  registerType(type, content) {
    this.types[type.name.string] = content;
    this.typeNames[type.name.string] = type.name;
  }

  checkRegisteredTypes() {
    const resolvedTypes = new Set();
    const resolveType = (name, targetType, usedTypes = [], ignoredTypes = []) => {
      if (resolvedTypes.has(name) || ignoredTypes.includes(name)) {
        return;
      }

      if (usedTypes.includes(name)) {
        const usedType = this.types[name];
        const propertyMember = usedType.content.propertyMembers.find(pm => pm.value.type === name);
        const { typeAttributes } = propertyMember;
        if (typeAttributes.includes('nullable') || !typeAttributes.includes('required')) {
          return;
        }

        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`, this.typeNames[name].sourceMap);
      }

      usedTypes.push(name);

      const includedMixins = getIncludedMixins(targetType);
      const baseTypeName = targetType.type;

      if (baseTypeName && standardTypes.indexOf(baseTypeName) === -1) {
        const baseType = this.types[baseTypeName];

        if (!baseType) {
          throw new CrafterError(`Unknown type: ${baseTypeName}`);
        }

        resolveType(baseTypeName, baseType, usedTypes);
      }

      includedMixins.forEach((mixin) => {
        const mixinName = mixin.className;
        const baseType = this.types[mixinName];

        this.checkMixinExists(mixin);

        if (mixinName === name) {
          throw new CrafterError(`Base type '${name}' circularly referencing itself`);
        }

        resolveType(mixinName, baseType, usedTypes);
      });

      if (targetType.content) {
        if (targetType.content.propertyMembers) {
          targetType.content.propertyMembers.forEach(member => {
            if (member.value) {
              if (member.value.type) {
                if (this.types[member.value.type]) {
                  resolveType(member.value.type, this.types[member.value.type], usedTypes);
                }
              }
              if (member.value.nestedTypes) {
                member.value.nestedTypes.forEach(type => {
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

  checkTypeExists(typeName) {
    if (typeName !== null) {
      const allTypes = [...standardTypes, ...Object.keys(this.types)];
      const isTypeDefined = t => allTypes.includes(t);

      const { type, nestedTypes } = utils.resolveType(typeName);
      const typeIsDefined = nestedTypes ? nestedTypes.every(isTypeDefined) : isTypeDefined(type);

      if (!typeIsDefined) {
        throw new CrafterError(`Base type "${typeName}" is not defined in the document.`);
      }
    }
  }

  checkMixinExists(mixin) {
    if (!Object.prototype.hasOwnProperty.call(this.types, mixin.className)) {
      throw new CrafterError(`Mixin "${mixin.className}" is not defined in the document.`, mixin.sourceMap);
    }
  }

  checkUsedMixins(target) {
    const includedMixins = getIncludedMixins(target);
    const checkMixinExists = this.checkMixinExists.bind(this);

    includedMixins.forEach((mixin) => {
      checkMixinExists(mixin);
    });
  }

  getStandardBaseType(name) {
    const usedTypes = [];

    const getBaseType = () => {
      if (usedTypes.includes(name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`, this.typeNames[name].sourceMap);
      }

      usedTypes.push(name);

      try {
        name = this.types[name].type;
      } catch (e) {
        throw new CrafterError('Type not found');
      }

      if (name && !standardTypes.includes(name)) {
        name = getBaseType(name);
      }

      return name;
    };

    if (standardTypes.includes(name)) {
      return name;
    }

    return getBaseType() || types.object;
  }
}

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

module.exports = TypeResolver;
