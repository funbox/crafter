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
    this.sourceBuffer = Buffer.from(source);
    this.linefeedOffsets = getLinefeedOffsets(source);
    this.data = {};
    this.frames = [];
    this.resourcePrototypes = [];
    this.usedResources = new Map();
    this.currentFile = options.currentFile;
    this.logger = options.logger;
    this.sourceMapsEnabled = options.sourceMapsEnabled;
    this.entryDir = options.entryDir;
    this.typeExtractingInProgress = false;
    this.warningsEnabled = true;
    this.warnings = [];
    this.filePaths = [];
    this.debugMode = options.debugMode;

    this.sectionKeywordSignatureParsers = [
      'DefaultValue',
      'SampleValue',
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
      'SchemaStructureGroup',
      'ResourcePrototypes',
    ].map(name => parsers[`${name}Parser`]);

    this.typeResolver = new TypeResolver();
    this.resourcePrototypeResolver = new PrototypeResolver();
  }

  addType(type, content) {
    this.typeResolver.registerType(type, content);
  }

  getType(typeName) {
    return this.typeResolver.types[typeName];
  }

  checkTypeExists(typeName) {
    return this.typeResolver.checkTypeExists(typeName);
  }

  addResource(resource) {
    this.usedResources.set(resource.href, resource);
  }

  checkResourceExists(resource) {
    const existingResource = this.usedResources.get(resource.href);

    if (!existingResource) {
      return false;
    }

    if (existingResource && existingResource.method) {
      return existingResource.method === resource.method;
    }

    return true;
  }

  addResourcePrototype(prototype) {
    if (this.resourcePrototypeResolver.prototypes[prototype.title.string]) {
      console.error(`${prototype.title} resource prototype already defined`);
    }
    this.resourcePrototypeResolver.prototypes[prototype.title.string] = prototype;
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

  enableWarnings() {
    this.warningsEnabled = true;
  }

  suppressWarnings() {
    this.warningsEnabled = false;
  }

  addWarning(text, sourceMap) {
    if (this.warningsEnabled) {
      this.warnings.push({ text, sourceMap });
      if (this.logger) {
        this.logger.warn(text, [sourceMap.charBlocks[0].startLine, sourceMap.file]);
      }
    }
  }

  addTypeMismatchWarning(value, requiredType, sourceMap) {
    this.addWarning(`Invalid value format "${value}" for type "${requiredType}".`, sourceMap);
  }
}

function getLinefeedOffsets(source) {
  const offsets = [];
  for (let i = 0; i < source.length; ++i) {
    if (source[i] === '\n') {
      offsets.push(i);
    }
  }

  if (source[source.length - 1] !== '\n') {
    offsets.push(source.length);
  }

  return offsets;
}

module.exports = Context;
