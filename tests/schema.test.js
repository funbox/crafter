const ArrayElement = require('../parsers/elements/ArrayElement');
const ValueMemberElement = require('../parsers/elements/ValueMemberElement');
const EnumElement = require('../parsers/elements/EnumElement');
const EnumMemberElement = require('../parsers/elements/EnumMemberElement');
const MSONMixinElement = require('../parsers/elements/MSONMixinElement');
const ObjectElement = require('../parsers/elements/ObjectElement');
const PropertyMemberElement = require('../parsers/elements/PropertyMemberElement');
const StringElement = require('../parsers/elements/StringElement');
const OneOfTypeElement = require('../parsers/elements/OneOfTypeElement');
const OneOfTypeOptionElement = require('../parsers/elements/OneOfTypeOptionElement');
const RequestElement = require('../parsers/elements/RequestElement');
const AttributesElement = require('../parsers/elements/AttributesElement');
const ResponseElement = require('../parsers/elements/ResponseElement');
const NumberElement = require('../parsers/elements/NumberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const Context = require('../Context');

describe('schema', () => {
  describe('ArrayElement', () => {
    it('one member', () => {
      const el = new ArrayElement(
        createValueMemberElements([
          ['string'],
        ]),
      );
      expect(el.getSchema({})).toEqual([
        {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        [],
      ]);
    });

    it('multiple members', () => {
      const el = new ArrayElement(
        createValueMemberElements([
          ['string'],
          ['number'],
          ['boolean'],
        ]),
      );
      expect(el.getSchema({})).toEqual([
        {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
            ],
          },
        },
        [],
      ]);
    });

    it('fixed', () => {
      const el = new ArrayElement(
        createValueMemberElements([
          ['string', [], 'hello'],
          ['number', [], '42'],
          ['boolean', [], 'true'],
        ]),
      );
      expect(el.getSchema({}, { isFixed: true })).toEqual([
        {
          type: 'array',
          minItems: 3,
          items: [
            {
              type: 'string',
              enum: ['hello'],
            },
            {
              type: 'number',
              enum: [42],
            },
            {
              type: 'boolean',
              enum: [true],
            },
          ],
          additionalItems: false,
        },
        [],
      ]);
    });

    it('removes duplicating primitive types', () => {
      const el = new ArrayElement(
        createValueMemberElements([
          ['string'],
          ['string'],
        ]),
      );
      expect(el.getSchema({}, { isFixedType: true })).toEqual([
        {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
            ],
          },
        },
        [],
      ]);
    });

    it('removes duplicating complex types', () => {
      const createObj = () => {
        const obj = new ObjectElement();
        obj.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));
        obj.propertyMembers.push(new PropertyMemberElement(new StringElement('bar'), new ValueMemberElement(), []));

        const valueMember = new ValueMemberElement('object');
        valueMember.content = obj;
        return valueMember;
      };

      const el = new ArrayElement([
        createObj(),
        createObj(),
      ]);
      expect(el.getSchema({}, { isFixedType: true })).toEqual([
        {
          type: 'array',
          items: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  foo: { type: 'string' },
                  bar: { type: 'string' },
                },
              },
            ],
          },
        },
        [],
      ]);
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
      expect(el.getSchema({})).toEqual([
        {
          type: 'string',
          enum: ['foo', 'bar'],
        },
        [],
      ]);
    });
  });

  describe('MSONMixinElement', () => {
    it('getSchema', () => {
      const el = new MSONMixinElement('User');
      const types = {
        User: new ValueMemberElement('boolean'),
      };
      expect(el.getSchema(types)).toEqual([
        {
          type: 'boolean',
        },
        [],
      ]);
    });
  });

  describe('ObjectElement', () => {
    it('getSchema', () => {
      const el = new ObjectElement();
      el.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));
      el.propertyMembers.push(new PropertyMemberElement(new StringElement('bar'), new ValueMemberElement(), []));
      expect(el.getSchema({})).toEqual([
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        },
        [],
      ]);
    });
  });

  describe('OneOfTypeElement', () => {
    it('getSchema', () => {
      const el = new OneOfTypeElement(null);
      el.options.push(new OneOfTypeOptionElement([new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), [])], null));
      el.options.push(new OneOfTypeOptionElement([new PropertyMemberElement(new StringElement('bar'), new ValueMemberElement(), [])], null));
      expect(el.getSchema({})).toEqual([
        {
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
        },
        [],
      ]);
    });
  });

  describe('OneOfTypeOptionElement', () => {
    it('getSchema', () => {
      const el = new OneOfTypeOptionElement([
        new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []),
        new PropertyMemberElement(new StringElement('bar'), new ValueMemberElement(), []),
      ], null);
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        },
        [],
      ]);
    });
  });

  describe('PropertyMemberElement', () => {
    it('without description', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []);
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        [],
      ]);
    });

    it('with description', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), [], new StringElement('hello'));
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: {
              type: 'string',
              description: 'hello',
            },
          },
        },
        [],
      ]);
    });

    it('required', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), ['required']);
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: { type: 'string' },
          },
          required: ['foo'],
        },
        [],
      ]);
    });

    it('fixed', () => {
      const el = new PropertyMemberElement(
        new StringElement('status'),
        createValueMemberElement(['string', ['fixed'], 'ok']),
        [],
      );
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            status: {
              type: 'string',
              enum: ['ok'],
            },
          },
        },
        [],
      ]);
    });

    it('fixed parent', () => {
      const el = new PropertyMemberElement(
        new StringElement('status'),
        createValueMemberElement(['string', [], 'ok']),
        [],
      );
      expect(el.getSchema({}, { isFixed: true })).toEqual([
        {
          properties: {
            status: {
              type: 'string',
              enum: ['ok'],
            },
          },
          required: [
            'status',
          ],
        },
        [],
      ]);
    });

    it('nullable', () => {
      const el = new PropertyMemberElement(
        new StringElement('foo'),
        new ValueMemberElement(undefined, ['nullable']),
        [],
      );
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: {
              type: ['string', 'null'],
            },
          },
        },
        [],
      ]);
    });

    it('pattern', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement('string', [['pattern', '\\d{3,6}']]), []);
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: {
              type: 'string',
              pattern: '\\d{3,6}',
            },
          },
        },
        [],
      ]);
    });

    it('format', () => {
      const el = new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement('string', [['format', 'date-time']]), []);
      expect(el.getSchema({})).toEqual([
        {
          properties: {
            foo: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        [],
      ]);
    });
  });

  describe('RequestElement', () => {
    it('not empty', () => {
      const el = new RequestElement('application/json');
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual([
        {
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'string',
        },
      ]);
    });

    it('empty', () => {
      const el = new RequestElement('application/json');
      expect(el.getSchema({})).toEqual([undefined]);
    });

    it('Content-Type is not application/json', () => {
      const el = new RequestElement();
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual([undefined]);
    });
  });

  describe('ResponseElement', () => {
    it('not empty', () => {
      const el = new ResponseElement(new NumberElement(200), 'application/json');
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual([
        {
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'string',
        },
      ]);
    });

    it('empty', () => {
      const el = new ResponseElement(new NumberElement(200), 'application/json');
      expect(el.getSchema({})).toEqual([undefined]);
    });

    it('Content-Type is not application/json', () => {
      const el = new ResponseElement(new NumberElement(200));
      el.content.push(new AttributesElement(new ValueMemberElement()));
      expect(el.getSchema({})).toEqual([undefined]);
    });
  });

  describe('ValueMemberElement', () => {
    it('with resolved type', () => {
      const User = new ValueMemberElement();
      User.content = new ObjectElement();
      User.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));

      const el = new ValueMemberElement('User');

      expect(el.getSchema({ User })).toEqual([
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
        [],
      ]);
    });

    it('with content', () => {
      const el = new ValueMemberElement();
      el.content = new ObjectElement();
      el.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));

      expect(el.getSchema({})).toEqual([
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
        [],
      ]);
    });

    it('with resolved type and content', () => {
      const User = new ValueMemberElement();
      User.content = new ObjectElement();
      User.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));

      const el = new ValueMemberElement('User');
      el.content = new ObjectElement();
      el.content.propertyMembers.push(new PropertyMemberElement(new StringElement('bar'), new ValueMemberElement(), []));

      expect(el.getSchema({ User })).toEqual([
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        },
        [],
      ]);
    });

    it('file', () => {
      const el = new ValueMemberElement('file');
      expect(el.getSchema({})).toEqual([
        {
          type: 'string',
          contentEncoding: 'base64',
        },
        [],
      ]);
    });

    it('nullable', () => {
      const el = new ValueMemberElement('number');
      expect(el.getSchema({}, { isNullable: true })).toEqual([
        {
          type: ['number', 'null'],
        },
        [],
      ]);
    });

    it('nullable object', () => {
      const User = new ValueMemberElement();
      User.content = new ObjectElement();
      User.content.propertyMembers.push(new PropertyMemberElement(new StringElement('foo'), new ValueMemberElement(), []));

      const el = new ValueMemberElement('User');

      expect(el.getSchema({ User }, { isNullable: true })).toEqual([
        {
          type: ['object', 'null'],
          properties: {
            foo: { type: 'string' },
          },
        },
        [],
      ]);
    });

    it('nullable enum', () => {
      const Foo = new ValueMemberElement();
      Foo.content = new EnumElement('enum');
      Foo.content.members.push(new EnumMemberElement('foo'));
      Foo.content.members.push(new EnumMemberElement('bar'));

      const el = new ValueMemberElement('Foo');

      expect(el.getSchema({ Foo }, { isNullable: true })).toEqual([
        {
          type: ['string', 'null'],
          enum: ['foo', 'bar', null],
        },
        [],
      ]);
    });

    it('nullable array', () => {
      const Barr = new ValueMemberElement();
      Barr.content = new ArrayElement([
        new ValueMemberElement('string'),
      ]);

      const el = new ValueMemberElement('Barr');

      expect(el.getSchema({ Barr }, { isNullable: true })).toEqual([
        {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        },
        [],
      ]);
    });

    it('fixed', () => {
      const el = createValueMemberElement(['string', [], 'ok']);
      expect(el.getSchema({}, { isFixed: true })).toEqual([
        {
          type: 'string',
          enum: ['ok'],
        },
        [],
      ]);
    });

    it('fixed/sample', () => {
      const el = new ValueMemberElement('string', [], 'ok', '', true);
      expect(el.getSchema({}, { isFixed: true })).toEqual([
        {
          type: 'string',
        },
        [],
      ]);
    });

    it('type is "string" by default', () => {
      const el = new ValueMemberElement();
      expect(el.getSchema({})).toEqual([
        {
          type: 'string',
        },
        [],
      ]);
    });
  });
});

function createValueMemberElements(elementsArgs) {
  return elementsArgs.map(createValueMemberElement);
}

function createValueMemberElement(elArgs) {
  const element = new ValueMemberElement(...elArgs);
  ValueMemberProcessor.fillBaseType(new Context('', [], {}), element);
  return element;
}
