const types = require('../types');
const Refract = require('../Refract');
const { convertType } = require('../utils');

class DefaultValueProcessor {
  constructor(defaultElement, valuesType) {
    this.defaultElement = defaultElement;
    this.valuesType = valuesType;
  }

  buildDefaultFor(structureType) {
    const { values } = this.defaultElement;
    switch (structureType) {
      case types.enum:
        this.defaultElement.type = Refract.elements.enum;
        this.defaultElement.content = getContentItem(values[0], this.valuesType);
        break;
      case types.array:
        this.defaultElement.type = Refract.elements.array;
        this.defaultElement.content = values.map((value) => getContentItem(value, this.valuesType));
        break;
      case types.object:
        this.defaultElement.type = Refract.elements.object;
        this.defaultElement.content = values.map((value) => getContentItem(value, this.valuesType));
        break;
      default:
        this.defaultElement.type = structureType;
        this.defaultElement.content = getContentItem(values[0], this.valuesType).content;
        break;
    }
  }
}

function getContentItem(value, type) {
  if (value.toRefract) {
    const refract = value.toRefract();
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

module.exports = DefaultValueProcessor;
