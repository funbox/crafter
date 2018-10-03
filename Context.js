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
    this.sourceMapsEnabled = options.sourceMapsEnabled;
    this.entryDir = options.entryDir;

    this.sectionKeywordSignatureParsers = [
      'DefaultValue',
      'MSONMixin',
      'MSONMemberGroup',
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
    if (this.typeResolver.types[type.name.string]) {
      console.error(`${type.name.string} type already defined`);
    }
    this.typeResolver.types[type.name.string] = type.content;
  }

  getType(typeName) {
    return this.typeResolver.types[typeName];
  }

  checkTypeExists(typeName) {
    return this.typeResolver.checkTypeExists(typeName);
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
    const currentDir = this.currentFile ? path.dirname(this.currentFile) : this.entryDir;
    const fullPath = path.resolve(currentDir, filename);
    let file;

    try {
      file = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    } catch (e) {
      throw new CrafterError(`File reading error. File "${filename}" not found or unreadable.`);
    }

    const ast = utils.markdownSourceToAST(file);
    const context = new Context(file, [], {
      currentFile: fullPath,
      entryDir: this.entryDir,
    });

    return { ast, context };
  }

  resolvePathRelativeToEntryDir(filename) {
    const currentDir = this.currentFile ? path.dirname(this.currentFile) : this.entryDir;
    const absPath = path.resolve(currentDir, filename);
    return path.relative(this.entryDir, absPath);
  }
}

module.exports = Context;
