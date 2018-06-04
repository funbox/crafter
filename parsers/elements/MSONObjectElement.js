const Refract = require('../../Refract');

class MSONObjectElement {
  constructor(typeName, baseType) {
    this.name = typeName;
    this.baseType = baseType; // TODO: Может быть задан неявно, нужно его высчитывать (для вывода в refract и валидаций)
    this.content = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.object,
      content: this.content.map(a => a.toRefract()),
    };

    if (this.name) {
      result.meta = {
        id: {
          element: Refract.elements.string,
            content: this.name
        }
      };
    }

    return result;
  }
}

module.exports = MSONObjectElement;