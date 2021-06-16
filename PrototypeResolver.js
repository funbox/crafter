const { CrafterError } = require('./utils');

class PrototypeResolver {
  constructor() {
    this.prototypes = {};
    this.resolvedPrototypes = new Set();
    this.prototypeLocations = {};
  }

  registerPrototype(prototype, sourceFile) {
    const protoName = prototype.title.string;
    if (this.prototypes[protoName]) {
      throw new CrafterError(`Resource prototype "${protoName}" already defined`, prototype.sourceMap);
    }
    this.prototypes[protoName] = prototype;
    this.prototypeLocations[protoName] = sourceFile;
  }

  extendWith(externalResolver) {
    if (!externalResolver) return;

    const [isValid, errorText] = validateResolver(externalResolver);

    if (!isValid) {
      throw new Error(`Failed to extend prototype resolver: ${errorText}`);
    }

    Object.entries(externalResolver.prototypeLocations).forEach(([protoName, location]) => {
      const existingLocation = this.prototypeLocations[protoName];
      if (existingLocation !== undefined && existingLocation !== location) {
        throw new CrafterError(`Resource prototype "${protoName}" already defined in ${existingLocation}`);
      }

      if (existingLocation === undefined) {
        this.prototypeLocations[protoName] = location;
      }
    });

    Object.entries(externalResolver.prototypes).forEach(([protoName, prototype]) => {
      if (this.prototypes[protoName] === undefined) {
        this.prototypes[protoName] = prototype;
      }
    });
    this.resolvedPrototypes = new Set([...this.resolvedPrototypes, ...externalResolver.resolvedPrototypes]);
  }

  resolveRegisteredPrototypes() {
    const usedPrototypes = [];

    const resolvePrototype = (targetProto) => {
      if (usedPrototypes.includes(targetProto.title.string)) {
        throw new CrafterError(`Dependencies loop: ${usedPrototypes.concat([targetProto.title.string]).join(' - ')}`, targetProto.sourceMap);
      }

      if (this.resolvedPrototypes.has(targetProto.title.string)) {
        return;
      }

      usedPrototypes.push(targetProto.title.string);
      const baseProtoNames = targetProto.prototypes;

      baseProtoNames.forEach((protoName) => {
        const basePrototype = this.prototypes[protoName.string];

        if (!basePrototype) {
          throw new CrafterError(`Unknown prototype: ${protoName.string}`, protoName.sourceMap);
        }

        resolvePrototype(basePrototype);

        copyNewContent(basePrototype, targetProto);
      });

      usedPrototypes.pop();
      this.resolvedPrototypes.add(targetProto.title.string);
    };

    Object.values(this.prototypes).forEach((p) => {
      resolvePrototype(p);
    });
  }
}

function copyNewContent(src, target) {
  src.responses.forEach((r) => {
    if (!hasResponse(r)) {
      target.responses.push(r);
    }
  });

  function hasResponse(srcAttr) {
    return !!target.responses.find(a => a.statusCode.equals(srcAttr.statusCode));
  }
}

function validateResolver(resolver) {
  if (typeof resolver !== 'object') {
    return [false, 'resolver should be an object'];
  }

  if ([resolver.prototypes, resolver.resolvedPrototypes].some(field => (typeof field !== 'object'))) {
    return [false, 'resolver should have a valid form'];
  }

  return [true];
}

module.exports = PrototypeResolver;
