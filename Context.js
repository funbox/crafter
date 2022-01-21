const fs = require('fs');
const path = require('path');
const SectionTypes = require('./SectionTypes');
const TypeResolver = require('./TypeResolver');
const PrototypeResolver = require('./PrototypeResolver');
const utils = require('./utils');

const CrafterError = utils.CrafterError;

/**
 * @typedef {object} ContextOptions
 * @property {string} currentFile - name of the current file including full path
 * @property {string} filename - name of the current file including path relative to the entry directory
 * @property {object} logger
 * @property {boolean} sourceMapsEnabled - enable source maps generation
 * @property {string} entryDir - base directory relative to which Crafter resolves imports
 * @property {boolean} debugMode - mode that disables catching some of the exceptions and allows to examine a stack trace of an error
 * @property {function} readFile - a function to read imported file that needed for interception and processing of Import commands
 * @property {boolean} languageServerMode - parsing mode for Language Server: some errors are ignored, no typechecking of named types, disabled generation of JSON Schema and Body
 */

class Context {
  /**
   * @param {string} source - source code to parse
   * @param {object} parsers - hash object with parsers
   * @param {ContextOptions} options
   */
  constructor(source, parsers, options) {
    this.sourceLines = source.split('\n');
    this.sourceBuffer = Buffer.from(source);
    this.linefeedOffsets = getLinefeedOffsets(source);
    this.data = {};
    this.frames = [];
    this.resourcePrototypes = [];
    this.usedActions = new Set();
    this.currentFile = options.currentFile;
    this.filename = options.filename;
    this.logger = options.logger;
    this.sourceMapsEnabled = options.sourceMapsEnabled || options.languageServerMode;
    this.entryDir = options.entryDir;
    this.typeExtractingInProgress = false;
    this.warningsEnabled = true;
    this.warnings = [];
    this.filePaths = [];
    this.importsSourceMaps = [];
    this.debugMode = options.debugMode;
    this.readFile = options.readFile || readFile;
    this.languageServerMode = options.languageServerMode;
    this.parsers = parsers;
    this.usedFiles = this.currentFile ? [this.currentFileName()] : [];
    this.importHistory = new Set();
    this.importCache = new Map();

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
      'Import',
    ].map(name => parsers[`${name}Parser`]);

    this.typeResolver = new TypeResolver();
    this.resourcePrototypeResolver = new PrototypeResolver();
  }

  addType(type, content, sourceFile) {
    this.typeResolver.registerType(type, content, sourceFile);
  }

  getType(typeName) {
    return this.typeResolver.types[typeName];
  }

  addAction(actionString) {
    this.usedActions.add(actionString);
  }

  addActions(actionsArray = []) {
    actionsArray.forEach(action => this.addAction(action));
  }

  checkActionExists(actionString) {
    return this.usedActions.has(actionString);
  }

  addResourcePrototype(prototype, sourceFile) {
    this.resourcePrototypeResolver.registerPrototype(prototype, sourceFile);
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

  async getApibAST(filename, sourceMap) {
    const currentDir = this.currentFile ? path.dirname(this.currentFile) : this.entryDir;
    const fullPath = path.normalize(path.join(currentDir, filename));
    let file;

    try {
      file = await this.readFile(fullPath);
    } catch (e) {
      throw new CrafterError(`File reading error. File "${filename}" not found or unreadable.`, sourceMap);
    }

    const ast = utils.markdownSourceToAST(file);
    const context = new Context(file, this.parsers, {
      currentFile: fullPath,
      filename: this.resolvePathRelativeToEntryDir(filename),
      entryDir: this.entryDir,
      languageServerMode: this.languageServerMode,
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

function readFile(filePath) {
  return fs.promises.readFile(filePath, { encoding: 'utf-8' });
}

module.exports = Context;
