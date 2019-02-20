const types = require('../types');
const Refract = require('../Refract');
const { convertType } = require('../utils');

class SampleValueProcessor {
  constructor(sampleElement, membersType) {
    this.sampleElement = sampleElement;
    this.membersType = membersType;
  }

  buildSamplesFor(structureType) {
    const { members } = this.sampleElement;
    switch (structureType) {
      case types.enum:
        this.sampleElement.type = Refract.elements.enum;
        this.sampleElement.content = getContentItem(members[0], this.membersType);
        break;
      case types.array:
        this.sampleElement.type = Refract.elements.array;
        this.sampleElement.content = members.map((value) => getContentItem(value, this.membersType));
        break;
      case types.object:
        this.sampleElement.type = Refract.elements.object;
        this.sampleElement.content = members.map((value) => getContentItem(value, this.membersType));
        break;
      default:
        this.sampleElement.type = structureType;
        this.sampleElement.content = getContentItem(members[0], this.membersType).content;
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

module.exports = SampleValueProcessor;
