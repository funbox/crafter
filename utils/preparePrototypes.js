class CrafterError extends Error {
  constructor(message, sourceMap) {
    super(message);
    this.sourceMap = sourceMap;
  }
}

module.exports = function preparePrototypes(rawPrototypes, context, sourceMap) {
  if (context.languageServerMode) {
    return rawPrototypes.filter(p => context.resourcePrototypeResolver.prototypes[p]);
  }

  rawPrototypes.forEach(prototype => {
    if (!context.resourcePrototypeResolver.prototypes[prototype]) {
      throw new CrafterError(`Unknown resource prototype "${prototype}"`, sourceMap);
    }
  });

  return rawPrototypes;
};
