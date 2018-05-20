const ResourceParser = require('./parsers/ResourceParser');
const ActionParser = require('./parsers/ActionParser');
const ResourceGroupParser = require('./parsers/ResourceGroupParser');
const DataStructureGroupParser = require('./parsers/DataStructureGroupParser');
const ResourcePrototypesParser = require('./parsers/ResourcePrototypesParser');
const ParametersParser = require('./parsers/ParametersParser');

const SectionTypes = require('./SectionTypes');

class Context {
  constructor(source) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
  }

  sectionKeywordSignature(node) {
    return SectionTypes.calculateSectionType(node, this, [
      ParametersParser,
      ResourceParser,
      ActionParser,
      ResourceGroupParser,
      DataStructureGroupParser,
      ResourcePrototypesParser,
    ])
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