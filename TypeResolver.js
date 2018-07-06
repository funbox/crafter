const CrafterError = require('./utils').CrafterError;
const standardTypes = require('./types').standardTypes;

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

module.exports = TypeResolver;
