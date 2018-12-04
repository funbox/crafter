const fs = require('fs');
const path = require('path');
const Context = require('../Context');
const utils = require('../utils');
const { parser: SignatureParser } = require('../SignatureParser');
const DataStructureProcessor = require('../parsers/DataStructureProcessor');
const ValueMemberElement = require('../parsers/elements/ValueMemberElement');
const ObjectElement = require('../parsers/elements/ObjectElement');
const PropertyMemberElement = require('../parsers/elements/PropertyMemberElement');
const EnumElement = require('../parsers/elements/EnumElement');
const EnumMemberElement = require('../parsers/elements/EnumMemberElement');
const ArrayElement = require('../parsers/elements/ArrayElement');
const SampleValueElement = require('../parsers/elements/SampleValueElement');

const parsersDir = path.resolve(__dirname, '../parsers');
const Parsers = {};
fs.readdirSync(parsersDir).forEach((pFile) => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`${parsersDir}/${pFile}`); // eslint-disable-line import/no-dynamic-require
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

function getFilledElementFromSource(source) {
  const warnings = [];
  const ast = utils.markdownSourceToAST(source);
  const context = new Context(source, Parsers, {
    logger: {
      warn(text) { warnings.push(text); },
    },
  });
  const subject = utils.nodeText(ast.firstChild, context.sourceLines);
  const signature = new SignatureParser(subject);
  signature.warnings.forEach(warning => context.logger.warn(warning));
  const valueElement = new ValueMemberElement(signature.type, [], signature.value, '', signature.isSample);
  const nestedNode = ast.firstChild.next;
  const dataStructureProcessor = new DataStructureProcessor(nestedNode, Parsers);
  dataStructureProcessor.fillValueMember(valueElement, context);
  return { valueElement, warnings };
}

describe('DataStructureProcessor', () => {
  it('emits a warning via logger on trying to fill a primitive node', () => {
    const source = `
fields (string)
  + amount (number)
`;
    const { valueElement, warnings } = getFilledElementFromSource(source);
    const { type, content } = valueElement;
    expect(warnings.length).toBe(1);
    expect(type).toBe('string');
    expect(content).toBeNull();
  });

  it('fills an object with properties', () => {
    const source = `
fields (object)
  + amount (number)
  + msisdn (number)
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { type, content } = valueElement;
    expect(type).toBe('object');
    expect(content).toBeInstanceOf(ObjectElement);
    expect(content.propertyMembers).toHaveLength(2);
    content.propertyMembers.forEach(member => {
      expect(member).toBeInstanceOf(PropertyMemberElement);
    });
  });

  it('fills an object with properties and a single sample', () => {
    const source = `
fields (object)
  + amount (number)
  + msisdn (number)
  + Sample
    + amount: 200
    + msisdn: 79250000000
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { samples } = valueElement;
    expect(samples).toBeDefined();
    expect(samples).toHaveLength(1);
    const sampleElement = samples[0];
    expect(sampleElement).toBeInstanceOf(SampleValueElement);
    expect(sampleElement.members).toHaveLength(2);
    expect(sampleElement.members[0].name).toEqual({ string: 'amount', sourceMap: null });
    expect(sampleElement.members[1].name).toEqual({ string: 'msisdn', sourceMap: null });
  });

  it('fills an object with properties and multiple samples', () => {
    const source = `
fields (object)
  + amount (number)
  + msisdn (number)
  + Sample
    + amount: 200
    + msisdn: 79250000000
  + Sample
    + amount: 10
    + msisdn: 79991112233
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { samples } = valueElement;
    expect(samples).toBeDefined();
    expect(samples).toHaveLength(2);
    samples.forEach(sampleElement => {
      expect(sampleElement).toBeInstanceOf(SampleValueElement);
    });
    const [firstSample, secondSample] = samples;
    expect(firstSample.members[0].value).toHaveProperty('value', '200');
    expect(secondSample.members[0].value).toHaveProperty('value', '10');
  });

  it('fills an enum with members', () => {
    const source = `
kind (enum)
  + movement
  + track
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { type, content } = valueElement;
    expect(type).toBe('enum');
    expect(content).toBeInstanceOf(EnumElement);
    expect(content.members).toHaveLength(2);
    content.members.forEach(member => {
      expect(member).toBeInstanceOf(EnumMemberElement);
    });
  });

  it('replaces enum named type with the "string" type and emits a warning', () => {
    const source = `
kind (enum[CustomType])
  + movement
  + track
`;
    const { valueElement, warnings } = getFilledElementFromSource(source);
    const { content } = valueElement;
    expect(content.type).toBe('string');
    expect(warnings.length).toBe(1);
  });

  it('keeps the correct enum type', () => {
    const source = `
kind (enum[number])
  + 4
  + 5
`;
    const { valueElement, warnings } = getFilledElementFromSource(source);
    const { content } = valueElement;
    expect(content.type).toBe('number');
    expect(warnings.length).toBe(0);
  });

  it('warns about enum members type mismatch', () => {
    const source = `
kind (enum[number])
  + text1 - string member
  + text2 - string member
`;
    const { valueElement, warnings } = getFilledElementFromSource(source);
    const { content } = valueElement;
    expect(content.type).toBe('number');
    expect(warnings.length).toBe(2);
  });

  it('sets the type of an enum member the same as the enum type', () => {
    const source = `
kind (enum[number])
  + 4
  + 5
`;
    const { valueElement } = getFilledElementFromSource(source);
    const enumEl = valueElement.content;
    expect(enumEl.type).toBe('number');
    enumEl.members.forEach(member => {
      expect(member.type).toBe('number');
    });
  });

  it('fills an array with list-defined items', () => {
    const source = `
bar (array[boolean], fixed-type)
  + example 2 (string) - description 2
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { type, content } = valueElement;
    expect(type).toBe('array');
    expect(content).toBeInstanceOf(ArrayElement);
    expect(content.members).toHaveLength(2);
    content.members.forEach(member => {
      expect(member).toBeInstanceOf(ValueMemberElement);
    });
    expect(content.members[0].type).toBe('boolean');
    expect(content.members[1].type).toBe('string');
  });

  it('sets the type of an array sample the same as the array type', () => {
    const source = `
foo (array[number])
  + Sample
      + foo
      + bar
`;
    const { valueElement } = getFilledElementFromSource(source);
    const { samples } = valueElement;
    expect(samples).toBeDefined();
    expect(samples).toHaveLength(1);
    const sampleElement = samples[0];
    expect(sampleElement).toBeInstanceOf(SampleValueElement);
    expect(sampleElement.type).toBe('number');
  });
});