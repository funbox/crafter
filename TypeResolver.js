const types = require('./types');
const standardTypes = require('./types').standardTypes;
const MSONMixinElement = require('./parsers/elements/MSONMixinElement');
const PropertyMemberElement = require('./parsers/elements/PropertyMemberElement');
const utils = require('./utils');

const CrafterError = utils.CrafterError;

class TypeResolver {
  constructor() {
    this.types = {};
    this.resolvedTypes = new Set();
  }

  resolveRegisteredTypes() {
    const usedTypes = [];

    const resolveType = (name, targetType) => {
      if (this.resolvedTypes.has(name)) {
        return;
      }

      if (usedTypes.includes(name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`);
      }

      usedTypes.push(name);

      const includedMixins = getIncludedMixins(targetType);
      const baseTypeName = targetType.type;

      if (baseTypeName && standardTypes.indexOf(baseTypeName) === -1) {
        const baseType = this.types[baseTypeName];

        if (!baseType) {
          throw new CrafterError(`Unknown type: ${baseTypeName}`);
        }

        resolveType(baseTypeName, baseType);

        if (baseType.isComplex()) {
          copyNewAttributes(baseType, targetType);
        }
      }

      includedMixins.forEach((mixin) => {
        const mixinName = mixin.className;
        const baseType = this.types[mixinName];

        this.checkMixinExists(mixinName);

        if (mixinName === name) {
          throw new CrafterError(`Base type '${name}' circularly referencing itself`);
        }

        resolveType(mixinName, baseType);
      });

      usedTypes.pop();
      this.resolvedTypes.add(name);
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

  checkMixinExists(mixinName) {
    if (!Object.prototype.hasOwnProperty.call(this.types, mixinName)) {
      throw new CrafterError(`Mixin "${mixinName}" is not defined in the document.`);
    }
  }

  checkUsedMixins(target) {
    const includedMixins = getIncludedMixins(target);
    const checkMixinExists = this.checkMixinExists.bind(this);

    includedMixins.forEach((mixin) => {
      checkMixinExists(mixin.className);
    });
  }

  getStandardBaseType(name) {
    const usedTypes = [];

    const getBaseType = () => {
      if (usedTypes.includes(name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`);
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

    return getBaseType() || types.object;
  }
}

function copyNewAttributes(src, target) {
  const members = (!src.baseType || src.baseType === types.object) ? 'propertyMembers' : 'members';
  const parentAttributes = src.content[members].filter(a => !hasAttribute(a));
  target.content[members] = parentAttributes.concat(target.content[members]);

  function hasAttribute(srcAttr) {
    return !!target.content[members].find(a => a.name === srcAttr.name);
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
