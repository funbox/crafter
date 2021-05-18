const { CrafterError } = require('./utils');

class PrototypeResolver {
  constructor() {
    this.prototypes = {};
    this.resolvedPrototypes = new Set();
  }

  extendWith(externalResolver) {
    const [isValid, errorText] = validateResolver(externalResolver);

    if (!isValid) {
      throw new Error(`Failed to extend prototype resolver: ${errorText}`);
    }

    this.prototypes = {
      ...this.prototypes,
      ...externalResolver.prototypes,
    };
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
