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

        copyNewAttributes(baseType, targetType);
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
      const types = [...standardTypes, ...Object.keys(this.types)];
      const isTypeDefined = t => types.includes(t);

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
}

function copyNewAttributes(src, target) {
  const parentAttributes = src.content.propertyMembers.filter(a => !hasAttribute(a));
  target.content.propertyMembers = parentAttributes.concat(target.content.propertyMembers);

  function hasAttribute(srcAttr) {
    return !!target.content.propertyMembers.find(a => a.name === srcAttr.name);
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
