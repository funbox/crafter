const SectionTypes = require('./SectionTypes');

class Context {
  constructor(source) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
  }

  sectionKeywordSignature(node) {
    // TODO: в drafter эта функция зависит от порядка, нужно ли сделать тут так же?
    return SectionTypes.calculateSectionType(node, this, Object.values(Context.parsers));
  }

  pushFrame() {
    this.frames.push(this.data);
    this.data = {};
  }

  popFrame() {
    this.data = this.frames.pop();
  }
}

Context.parsers = {};
Context.defineParser = function(name, object) {
  this.parsers[name] = object;
};

module.exports = Context;