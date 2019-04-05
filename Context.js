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
    this.currentFile = options.currentFile;
    this.logger = options.logger;
    this.sourceMapsEnabled = options.sourceMapsEnabled;
    this.entryDir = options.entryDir;
    this.typeExtractingInProgress = false;
    this.typeResolvingInProgress = false;
    this.warnings = [];

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

  addWarning(text, sourceMapBlocks, file) {
    const warning = { text, sourceMapBlocks, file };
    if (!isDuplicateWarning(warning, this.warnings)) {
      this.warnings.push(warning);
      this.logger.warn(text, [sourceMapBlocks[0].startLine, file]);
    }
  }
}

function getLinefeedOffsets(source) {
  const offsets = [];
  for (let i = 0; i < source.length; ++i) {
    if (source[i] === '\n') {
      offsets.push(i);
    }
  }
  return offsets;
}

function isDuplicateWarning(warning, warnings) {
  for (let i = 0; i < warnings.length; i += 1) {
    if (sameWarnings(warning, warnings[i])) {
      return true;
    }
  }
  return false;
}

function sameWarnings(warningA, warningB) {
  if (warningA.text !== warningB.text) {
    return false;
  }
  if (warningA.file !== warningB.file) {
    return false;
  }
  if (warningA.sourceMapBlocks.length !== warningB.sourceMapBlocks.length) {
    return false;
  }
  for (let i = 0; i < warningA.sourceMapBlocks.length; i += 1) {
    if (!sameBlocks(warningA.sourceMapBlocks[i], warningB.sourceMapBlocks[i])) {
      return false;
    }
  }
  return true;
}

function sameBlocks(blockA, blockB) {
  const keys = ['offset', 'length', 'startLine', 'startColumn', 'endLine', 'endColumn'];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (blockA[key] !== blockB[key]) {
      return false;
    }
  }
  return true;
}

module.exports = Context;
