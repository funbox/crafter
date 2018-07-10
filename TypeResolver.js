const CrafterError = require('./utils').CrafterError;
const standardTypes = require('./types').standardTypes;
const MSONMixinElement = require('./parsers/elements/MSONMixinElement');
const PropertyMemberElement = require('./parsers/elements/PropertyMemberElement');

class TypeResolver {
  constructor() {
    this.types = {};
    this.resolvedTypes = new Set();
  }

  resolveRegisteredTypes() {
    const usedTypes = [];

    const resolveType = (name, targetType) => {
      if (usedTypes.includes(name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([name]).join(' - ')}`);
      }

      this.checkUsedMixins(this.types[name]);

      if (this.resolvedTypes.has(name)) {
        return;
      }

      usedTypes.push(name);
      const baseTypeName = targetType.type;

      if (baseTypeName && standardTypes.indexOf(baseTypeName) === -1) {
        const baseType = this.types[baseTypeName];

        if (!baseType) {
          throw new CrafterError(`Unknown type: ${baseTypeName}`);
        }

        resolveType(baseTypeName, baseType);

        copyNewAttributes(baseType, targetType);
      }

      usedTypes.pop();
      this.resolvedTypes.add(name);
    };

    Object.entries(this.types).forEach(([name, valueMember]) => {
      resolveType(name, valueMember);
    });
  }

  checkUsedMixins(target) {
    if (!target.propertyMembers) return;

    const usedMixins = getIncludedMixins(target);

    if (usedMixins.length === 0) return;

    usedMixins.forEach(mixin => {
      if (!this.types.hasOwnProperty(mixin.className)) {
        throw new CrafterError(`Mixin "${mixin.className}" is not defined in the document.`);
      }
    });
  }
}

function copyNewAttributes(src, target) {
  src.propertyMembers.forEach((a) => {
    if (!hasAttribute(a)) {
      target.propertyMembers.push(a);
    }
  });

  function hasAttribute(srcAttr) {
    return !!target.propertyMembers.find(a => a.name === srcAttr.name);
  }
}

function getIncludedMixins(target) {
  const appliedMixins = [];

  const processValueElement = tgt => {
    const res = tgt.propertyMembers.filter(member => {
      if (member instanceof PropertyMemberElement && member.value.propertyMembers) {
        processValueElement(member.value);
      }
      return member instanceof MSONMixinElement;
    });

    appliedMixins.push(...res);
  };

  processValueElement(target);

  return appliedMixins;
}

module.exports = TypeResolver;
