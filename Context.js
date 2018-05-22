const ResourceParser = require('./parsers/ResourceParser');
const ActionParser = require('./parsers/ActionParser');
const ResourceGroupParser = require('./parsers/ResourceGroupParser');
const DataStructureGroupParser = require('./parsers/DataStructureGroupParser');
const ResourcePrototypesParser = require('./parsers/ResourcePrototypesParser');
const ParametersParser = require('./parsers/ParametersParser');
const ResponseParser = require('./parsers/ResponseParser');
const BodyParser = require('./parsers/BodyParser');
const HeadersParser = require('./parsers/HeadersParser');

const SectionTypes = require('./SectionTypes');

class Context {
  constructor(source) {
    this.sourceLines = source.split('\n');
    this.data = {};
    this.frames = [];
  }

  sectionKeywordSignature(node) {
    // TODO: Проверить все ли парсеры здесь
    return SectionTypes.calculateSectionType(node, this, [
      HeadersParser,
      ResponseParser,
      BodyParser,
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