const SectionTypes = require('./SectionTypes');
const TypeResolver = require('./TypeResolver');
const PrototypeResolver = require('./PrototypeResolver');

class Context {
  constructor(source, parsers) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
    this.resourcePrototypes = [];
    this.sectionKeywordSignatureParsers = [];
    this.typeResolver = new TypeResolver();
    this.resourcePrototypeResolver = new PrototypeResolver();

    Object.values(parsers).forEach(parser => {
      if (!parser.skipSectionKeywordSignature) {
        this.sectionKeywordSignatureParsers.push(parser);
      }
    });
  }

  addType(type) {
    if (this.typeResolver.types[type.object.name]) {
      console.error(`${type.object.name} type already defined`);
    }
    this.typeResolver.types[type.object.name] = type.object;
  }

  addResourcePrototype(prototype) {
    if (this.resourcePrototypeResolver.prototypes[prototype.title]) {
      console.error(`${prototype.title} resource prototype already defined`);
    }
    this.resourcePrototypeResolver.prototypes[prototype.title] = prototype;
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