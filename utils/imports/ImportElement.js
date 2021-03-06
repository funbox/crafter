/**
 * This class stores data acquired after the parsing of an imported document.
 * It is not a part of API Elements (https://apielements.org/) spec and does not get into refract,
 * and it serves only as a temporary container.
 */
class ImportElement {
  /**
   * @param {string=} importId
   * @param {BlueprintElement=} childBlueprint
   * @param {Context=} childContext
   * @param {SourceMap=} sourceMap
   */
  constructor(importId, childBlueprint, childContext, sourceMap) {
    const refractMapper = (element) => {
      element.importedFrom = element.importedFrom || importId;
      return element;
    };

    if (childBlueprint) {
      this.refractElements = childBlueprint.content.map(refractMapper);
      this.refractAnnotations = childBlueprint.annotations.map(refractMapper);
    }

    if (childContext) {
      this.importedTypes = {
        types: childContext.typeResolver.types,
        typeNames: childContext.typeResolver.typeNames,
        typeLocations: childContext.typeResolver.typeLocations,
      };
      this.importedPrototypes = {
        prototypes: childContext.resourcePrototypeResolver.prototypes,
        resolvedPrototypes: childContext.resourcePrototypeResolver.resolvedPrototypes,
        prototypeLocations: childContext.resourcePrototypeResolver.prototypeLocations,
      };
      this.usedActions = Array.from(childContext.usedActions);
    }

    this.sourceMap = sourceMap;
  }
}

module.exports = ImportElement;
