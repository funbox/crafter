const utilsLog = require('./log');

module.exports = function preparePrototypes(rawPrototypes, context, sourceMap) {
  if (context.languageServerMode) {
    return rawPrototypes.filter(p => context.resourcePrototypeResolver.prototypes[p]);
  }

  rawPrototypes.forEach(prototype => {
    if (!context.resourcePrototypeResolver.prototypes[prototype]) {
      throw new utilsLog.CrafterError(`Unknown resource prototype "${prototype}"`, sourceMap);
    }
  });

  return rawPrototypes;
};
