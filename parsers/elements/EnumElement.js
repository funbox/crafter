const Refract = require('../../Refract');
const utils = require('../../utils');
const { standardTypes } = require('../../types');

class EnumElement {
  constructor(type) {
    const resolvedType = utils.resolveType(type);

    this.members = [];
    this.defaultValue = null;
    this.sampleValue = null;
    this.type = (resolvedType.nestedTypes[0] ? resolvedType.nestedTypes[0] : 'string');
  }

  toRefract() {
    const self = this;

    if (!standardTypes.includes(this.type)) {
      utils.showWarningMessage('Warning: enum must not use named types as a sub-type. Sub-type "string" will be used instead.');
      this.type = 'string';
    }

    this.members.forEach((member) => {
      const typesMatch = utils.compareAttributeTypes(self, member);

      if (!typesMatch) {
        utils.showWarningMessage(`Warning:  Invalid value format "${member.name}" for enum type '${self.type}'.`);
      }

      if (!member.type) member.type = self.type;
    });

    const result = {
      enumerations: {
        element: Refract.elements.array,
        content: this.members.map(e => e.toRefract()),
      },
    };

    if (this.defaultValue) {
      result.default = {
        element: Refract.elements.enum,
        content: this.defaultValue.toRefract(),
      };
    }

    if (this.sampleValue) {
      result.samples = {
        element: Refract.elements.array,
        content: [{
          element: Refract.elements.enum,
          content: this.sampleValue.toRefract(),
        }],
      };
    }
    return result;
  }
}

module.exports = EnumElement;
