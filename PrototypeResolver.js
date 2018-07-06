const CrafterError = require('./utils').CrafterError;

class PrototypeResolver {
  constructor() {
    this.prototypes = {};
    this.resolvedPrototypes = new Set();
  }

  resolveRegisteredPrototypes() {
    const usedPrototypes = [];

    const resolvePrototype = (targetProto) => {
      if (usedPrototypes.includes(targetProto.title)) {
        throw new CrafterError(`Dependencies loop: ${usedPrototypes.concat([targetProto.title]).join(' - ')}`);
      }

      if (this.resolvedPrototypes.has(targetProto.title)) {
        return;
      }

      usedPrototypes.push(targetProto.title);
      const baseProtoNames = targetProto.basePrototypes;

      baseProtoNames.forEach((protoName) => {
        if (protoName) {
          const basePrototype = this.prototypes[protoName];

          if (!basePrototype) {
            throw new CrafterError(`Unknown prototype: ${protoName}`);
          }

          resolvePrototype(basePrototype);

          copyNewContent(basePrototype, targetProto);
        }
      });

      usedPrototypes.pop();
      this.resolvedPrototypes.add(targetProto.title);
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
    return !!target.responses.find(a => a.statusCode === srcAttr.statusCode);
  }
}

module.exports = PrototypeResolver;
