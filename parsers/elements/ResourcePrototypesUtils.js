const Refract = require('../../Refract');

module.exports = {
  addPrototypesToRefract(element, refractElement, sourceMapsEnabled) {
    if (element.prototypes.length) {
      refractElement.attributes = refractElement.attributes || {};
      refractElement.attributes.prototypes = {
        element: Refract.elements.array,
        content: element.prototypes.map(p => p.toRefract(sourceMapsEnabled)),
      };
    }
  },
};
