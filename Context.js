const SectionTypes = require('./SectionTypes');
const TypeResolver = require('./TypeResolver');
const PrototypeResolver = require('./PrototypeResolver');

class Context {
  constructor(source, parsers, options) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
    this.currentFile = options.currentFile;
    this.resourcePrototypes = [];

    this.sectionKeywordSignatureParsers = [
      'DefaultValue',
      'MSONMixin',
      'OneOfType',
      'Headers',
      'Attributes',
      'Request',
      'Response',
      'Parameters',
      'Resource',
      'Action',
      'ResourceGroup',
      'DataStructureGroup',
      'ResourcePrototypes',
    ].map(name => parsers[`${name}Parser`]);

    this.typeResolver = new TypeResolver();
    this.resourcePrototypeResolver = new PrototypeResolver();
  }

  addType(type) {
    if (this.typeResolver.types[type.name]) {
      console.error(`${type.name} type already defined`);
    }
    this.typeResolver.types[type.name] = type.content;
  }

  addResourcePrototype(prototype) {
    if (this.resourcePrototypeResolver.prototypes[prototype.title]) {
      console.error(`${prototype.title} resource prototype already defined`);
    }
    this.resourcePrototypeResolver.prototypes[prototype.title] = prototype;
  }

  sectionKeywordSignature(node) {
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
