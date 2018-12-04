const ArrayElement = require('../parsers/elements/ArrayElement');
const ValueMemberElement = require('../parsers/elements/ValueMemberElement');
const EnumElement = require('../parsers/elements/EnumElement');
const EnumMemberElement = require('../parsers/elements/EnumMemberElement');
const DefaultValueElement = require('../parsers/elements/DefaultValueElement');
const MSONMixinElement = require('../parsers/elements/MSONMixinElement');
const ObjectElement = require('../parsers/elements/ObjectElement');
const PropertyMemberElement = require('../parsers/elements/PropertyMemberElement');
const StringElement = require('../parsers/elements/StringElement');
const OneOfTypeElement = require('../parsers/elements/OneOfTypeElement');
const OneOfTypeOptionElement = require('../parsers/elements/OneOfTypeOptionElement');
const RequestElement = require('../parsers/elements/RequestElement');
const AttributesElement = require('../parsers/elements/AttributesElement');
const ResponseElement = require('../parsers/elements/ResponseElement');

describe('schema', () => {
  describe('ArrayElement', () => {
    it('one member', () => {
      const el = new ArrayElement([
        new ValueMemberElement('string'),
      ]);
      expect(el.getSchema({})).toEqual({
        type: 'array',
        items: {
          type: 'string',
        },
      });
    });

    it('multiple members', () => {
      const el = new ArrayElement([
        new ValueMemberElement('string'),
        new ValueMemberElement('number'),
        new ValueMemberElement('boolean'),
      ]);
      expect(el.getSchema({})).toEqual({
        type: 'array',
        items: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
          ],
        },
      });
    });
  });

  describe('EnumElement', () => {
    let el;

    beforeEach(() => {
      el = new EnumElement('enum');
      el.members.push(new EnumMemberElement('foo'));
      el.members.push(new EnumMemberElement('bar'));
    });

    it('without default value', () => {
      expect(el.getSchema({})).toEqual({
        type: 'string',
        enum: ['foo', 'bar'],
      });
    });

    it('with default value', () => {
      el.defaultValue = new DefaultValueElement('hello');
      expect(el.getSchema({})).toEqual({
        type: 'string',
        enum: ['foo', 'bar'],
        default: 'hello',
      });
    });
  });

  describe('MSONMixinElement', () => {
    it('getSchema', () => {
      const el = new MSONMixinElement('User');
      const types = {
        User: new ValueMemberElement('boolean'),
      };
      expect(el.getSchema(types)).toEqual({
        type: 'boolean',
      });
    });
  });

  describe('ObjectElement', () => {
    it('getSchema', () => {
      const el = new ObjectElement();
      el.propertyMembers.push(new PropertyMemberElement(new StringElement('foo')));
      el.propertyMembers.push(new PropertyMemberElement(new StringElement('bar')));
      expect(el.getSchema({})).toEqual({
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      });
    });
  });

  describe('OneOfTypeElement', () => {
    it('getSchema', () => {
      const el = new OneOfTypeElement();
      el.options.push(new OneOfTypeOptionElement([new PropertyMemberElement(new StringElement('foo'))]));
      el.options.push(new OneOfTypeOptionElement([new PropertyMemberElement(new StringElement('bar'))]));
      expect(el.getSchema({})).toEqual({
        oneOf: [
          {
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
        ],
      });
    });
  });

  describe('OneOfTypeOptionElement', () => {
    it('getSchema', () => {
      const el = new OneOfTypeOptionElement([
        new PropertyMemberElement(new StringElement('foo')),
        new PropertyMemberElement(new StringElement('bar')),
      ]);
      expect(el.getSchema({})).toEqual({
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      });
    });
  });

  describe('PropertyMemberElement', () => {
    it('without description', () => {
      const el = new PropertyMemberElement(new StringElement('foo'));
      expect(el.getSchema({})).toEqual({
        properties: {
          foo: { type: 'string' },
        },
      });
    });

    it('with description', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), [], 'hello');
      expect(el.getSchema({})).toEqual({
        properties: {
          foo: {
            type: 'string',
            description: 'hello',
          },
        },
      });
    });

    it('required', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), ['required']);
      expect(el.getSchema({})).toEqual({
        properties: {
          foo: { type: 'string' },
        },
        required: ['foo'],
      });
    });

    it('fixed', () => {
      const el = new PropertyMemberElement(
        new StringElement('status'),
        new ValueMemberElement('string', [], 'ok'),
        ['fixed'],
      );
      expect(el.getSchema({})).toEqual({
        properties: {
          status: {
            type: 'string',
            enum: ['ok'],
          },
        },
      });
    });

    it('nullable', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), ['nullable']);
      expect(el.getSchema({})).toEqual({
        properties: {
          foo: {
            type: ['string', 'null'],
          },
        },
      });
    });
  });

  describe('RequestElement', () => {
    it('not empty', () => {
      const el = new RequestElement('application/json');
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'string',
      });
    });

    it('empty', () => {
      const el = new RequestElement('application/json');
      expect(el.getSchema({})).toEqual({});
    });

    it('Content-Type is not application/json', () => {
      const el = new RequestElement();
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual({});
    });
  });

  describe('ResponseElement', () => {
    it('not empty', () => {
      const el = new ResponseElement(200, 'application/json');
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'string',
      });
    });

    it('empty', () => {
      const el = new ResponseElement(200, 'application/json');
      expect(el.getSchema({})).toEqual({});
    });

    it('Content-Type is not application/json', () => {
      const el = new ResponseElement(200);
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual({});
    });
  });

  describe('ValueMemberElement', () => {
    it('with resolved type', () => {
      const User = new ValueMemberElement();
      User.content = new ObjectElement();
      User.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo')));

      const el = new ValueMemberElement('User');

      expect(el.getSchema({ User })).toEqual({
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      });
    });

    it('with content', () => {
      const el = new ValueMemberElement();
      el.content = new ObjectElement();
      el.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo')));

      expect(el.getSchema({})).toEqual({
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      });
    });

    it('with resolved type and content', () => {
      const User = new ValueMemberElement();
      User.content = new ObjectElement();
      User.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo')));

      const el = new ValueMemberElement('User');
      el.content = new ObjectElement();
      el.content.propertyMembers.push(new PropertyMemberElement(new StringElement('bar')));

      expect(el.getSchema({ User })).toEqual({
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      });
    });

    it('file', () => {
      const el = new ValueMemberElement('file');
      expect(el.getSchema({})).toEqual({
        type: 'string',
        contentEncoding: 'base64',
      });
    });

    it('nullable', () => {
      const el = new ValueMemberElement('number');
      expect(el.getSchema({}, { isNullable: true })).toEqual({
        type: ['number', 'null'],
      });
    });

    it('fixed', () => {
      const el = new ValueMemberElement('string', [], 'ok');
      expect(el.getSchema({}, { isFixed: true })).toEqual({
        type: 'string',
        enum: ['ok'],
      });
    });

    it('type is "string" by default', () => {
      const el = new ValueMemberElement();
      expect(el.getSchema({})).toEqual({
        type: 'string',
      });
    });
  });
});