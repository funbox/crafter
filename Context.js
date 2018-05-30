const SectionTypes = require('./SectionTypes');

class Context {
  constructor(source, parsers) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
    this.sectionKeywordSignatureParsers = [];

    Object.values(parsers).forEach(parser => {
      if (!parser.skipSectionKeywordSignature) {
        this.sectionKeywordSignatureParsers.push(parser);
      }
    });
  }

  sectionKeywordSignature(node) {
    // TODO: в drafter эта функция зависит от порядка, нужно ли сделать тут так же?
    return SectionTypes.calculateSectionType(node, this, this.sectionKeywordSignatureParsers);
  }

  pushFrame() {
    this.frames.push(this.data);
    this.data = {};
  }

  popFrame() {
    this.data = this.frames.pop();
  }
}

module.exports = Context;