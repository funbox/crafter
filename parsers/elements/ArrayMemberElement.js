const utils = require('../../utils');

class ArrayMemberElement {
  constructor(type) {
    const resolvedType = utils.resolveType(type);

    this.type = resolvedType.type;
    this.content = null;
  }

  toRefract() {
    const type = this.type || (this.content ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.content) {
      result.content = this.content.toRefract();
    }

    return result;
  }
}

module.exports = ArrayMemberElement;
