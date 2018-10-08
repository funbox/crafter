const fs = require('fs');
const path = require('path');
const SectionTypes = require('./SectionTypes');
const TypeResolver = require('./TypeResolver');
const PrototypeResolver = require('./PrototypeResolver');
const utils = require('./utils');

const CrafterError = utils.CrafterError;

class Context {
  constructor(source, parsers, options) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
    this.resourcePrototypes = [];
    this.currentFile = options.currentFile;
    this.logger = options.logger;

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

  currentFileName() {
    return path.basename(this.currentFile);
  }

  pushFrame() {
    this.frames.push(this.data);
    this.data = {};
  }

  popFrame() {
    this.data = this.frames.pop();
  }

  getApibAST(filename) {
    const currentDir = path.dirname(this.currentFile);
    const fullPath = path.resolve(currentDir, filename);
    let file;

    try {
      file = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    } catch (e) {
      throw new CrafterError(`File reading error. File "${filename}" not found or unreadable.`);
    }

    const ast = utils.markdownSourceToAST(file);
    const context = new Context(file, [], { currentFile: fullPath });

    return { ast, context };
  }
}

module.exports = Context;
