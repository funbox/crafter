const CrafterError = require('./utils').CrafterError;

const primitiveTypes = [
  'string',
  'number',
  'boolean',
];

const standardTypes = primitiveTypes.concat(['object']);

class TypeResolver {
  constructor() {
    this.types = {};
    this.resolvedTypes = new Set();
  }

  resolve(type) {
    const baseTypeName = type.baseType;
    if (!baseTypeName || standardTypes.indexOf(baseTypeName) !== -1) {
      return;
    }

    const baseType = this.types[baseTypeName];
    copyNewAttributes(baseType, type);
  }

  resolveRegisteredTypes() {
    const usedTypes = [];

    const resolveType = (targetType) => {
      if (usedTypes.includes(targetType.name)) {
        throw new CrafterError(`Dependencies loop: ${usedTypes.concat([targetType.name]).join(' - ')}`);
      }

      if (this.resolvedTypes.has(targetType.name)) {
        return;
      }

      usedTypes.push(targetType.name);
      const baseTypeName = targetType.baseType;

      if (baseTypeName && standardTypes.indexOf(baseTypeName) === -1) {
        const baseType = this.types[baseTypeName];

        if (!baseType) {
          throw new CrafterError(`Unknown type: ${baseTypeName}`);
        }

        resolveType(baseType);

        copyNewAttributes(baseType, targetType);
      }

      usedTypes.pop();
      this.resolvedTypes.add(targetType.name);
    };

    Object.values(this.types).forEach(t => {
      resolveType(t);
    });
  }
}

function copyNewAttributes(src, target) {
  src.content.forEach(a => {
    if (!hasAttribute(a)) {
      target.content.push(a);
    }
  });

  function hasAttribute(srcAttr) {
    return !!target.content.find((a) => {
      return a.name === srcAttr.name;
    })
  }
}

module.exports = TypeResolver;