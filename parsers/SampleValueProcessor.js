const types = require('../types');
const Refract = require('../Refract');
const { convertType } = require('../utils');

class SampleValueProcessor {
  constructor(sampleElement, valuesType) {
    this.sampleElement = sampleElement;
    this.valuesType = valuesType;
  }

  prepareValuesForBody(sourceMapsEnabled) {
    this.sampleElement.valuesForBody = this.sampleElement.values.map(value => {
      if (value.toRefract) {
        const refract = value.toRefract(sourceMapsEnabled);
        if (typeof refract.content === 'object') {
          return value; // we don't need to go deeper
        }
        const converted = convertType(refract.content, this.valuesType);
        return converted.valid ? converted.value : undefined;
      }
      const converted = convertType(value, this.valuesType);
      return converted.valid ? converted.value : undefined;
    });
  }

  buildSamplesFor(structureType, sourceMapsEnabled) {
    const { values } = this.sampleElement;
    switch (structureType) {
      case types.enum:
        this.sampleElement.refractType = Refract.elements.enum;
        this.sampleElement.content = getContentItem(values[0], this.valuesType, sourceMapsEnabled);
        break;
      case types.array:
        this.sampleElement.refractType = Refract.elements.array;
        this.sampleElement.content = values.map((value) => getContentItem(value, this.valuesType, sourceMapsEnabled));
        break;
      case types.object:
        this.sampleElement.refractType = Refract.elements.object;
        this.sampleElement.content = values.map((value) => getContentItem(value, this.valuesType, sourceMapsEnabled));
        break;
      default:
        this.sampleElement.refractType = structureType;
        this.sampleElement.content = getContentItem(values[0], this.valuesType, sourceMapsEnabled).content;
        break;
    }
  }
}

function getContentItem(value, type, sourceMapsEnabled) {
  if (value.toRefract) {
    const refract = value.toRefract(sourceMapsEnabled);
    if (typeof refract.content === 'object') {
      return refract;
    }
    const content = convertType(refract.content, type);
    refract.element = type;
    refract.content = content.valid ? content.value : undefined;
    return refract;
  }
  const contentValue = convertType(value, type);
  const contentItem = { element: type };

  if (contentValue.valid) {
    contentItem.content = contentValue.value;
  }
  return contentItem;
}

module.exports = SampleValueProcessor;
