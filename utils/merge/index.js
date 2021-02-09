const equal = require('fast-deep-equal');

const utilsSourceMap = require('../sourceMap');

const StringElement = require('../../parsers/elements/StringElement');
const HeadersElement = require('../../parsers/elements/HeadersElement');
const Flags = require('../../Flags');

module.exports = {
  mergeSchemas(schema1, schema2) {
    const uniquifySchemas = this.uniquifySchemas;
    const propsToMerge = [
      'enum',
      'properties',
      'oneOf',
      'required',
      { name: 'minItems', action(first, second) { return first + second; } },
      {
        name: 'items',
        action(first, second) {
          if (Array.isArray(first)) {
            return [
              ...first,
              ...second,
            ].filter((v, i, a) => a.indexOf(v) === i);
          }

          const schemaVariants = [
            ...(first.anyOf ? first.anyOf : [first]),
            ...(second.anyOf ? second.anyOf : [second]),
          ];

          const uniqueVariants = uniquifySchemas(schemaVariants);

          if (uniqueVariants.length === 1) {
            return uniqueVariants[0];
          }

          return {
            anyOf: uniqueVariants,
          };
        },
      },
    ];
    const result = { ...schema1 };
    Object.keys(schema2).forEach(key => {
      const foundProp = propsToMerge.find(prop => (prop === key || (prop.name && prop.name === key)));
      if ((key in result) && foundProp) {
        if (foundProp.action) {
          result[key] = foundProp.action(result[key], schema2[key]);
          return;
        }
        if (Array.isArray(result[key])) {
          result[key] = [
            ...result[key],
            ...schema2[key],
          ].filter((v, i, a) => a.indexOf(v) === i);
        } else {
          result[key] = {
            ...result[key],
            ...schema2[key],
          };
        }
      } else {
        result[key] = schema2[key];
      }
    });
    return result;
  },

  uniquifySchemas(schemaVariants) {
    let primitiveVariants = [];
    const complexVariants = [];
    const equalTo = (item1) => (item2) => equal(item1, item2);

    schemaVariants.forEach(variant => {
      if (Object.keys(variant).length === 1 && variant.type) {
        primitiveVariants.push(variant.type);
        return;
      }
      if (!complexVariants.find(equalTo(variant))) {
        complexVariants.push(variant);
      }
    });

    primitiveVariants = primitiveVariants
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((v) => ({ type: v }));

    return primitiveVariants.concat(complexVariants);
  },

  mergeFlags(baseFlags, typeElement, options = { propagateFixedType: true }) {
    const typeElementAttributes = typeElement.typeAttributes || [];
    const typeElementPropagatedAttributes = typeElement.propagatedTypeAttributes || [];

    return new Flags({
      isFixed: baseFlags.isFixed || typeElementAttributes.includes('fixed') || typeElementPropagatedAttributes.includes('fixed'),
      isFixedType: (options.propagateFixedType && baseFlags.isFixedType) || typeElementAttributes.includes('fixedType') || typeElementPropagatedAttributes.includes('fixedType'),
      isNullable: typeElementAttributes.includes('nullable'),
      skipTypesInlining: baseFlags.skipTypesInlining,
    });
  },

  mergeStringElements(first, second) {
    const merged = new StringElement(first.string + second.string);
    if (first.sourceMap && second.sourceMap) {
      merged.sourceMap = utilsSourceMap.concatSourceMaps([first.sourceMap, second.sourceMap]);
    }
    return merged;
  },

  mergeHeadersSections(headersSections) {
    return headersSections.reduce((result, headersSection) => {
      result.headers.push(...headersSection.headers);
      result.sourceMap = result.sourceMap
        ? utilsSourceMap.concatSourceMaps([result.sourceMap, headersSection.sourceMap])
        : headersSection.sourceMap;
      return result;
    }, new HeadersElement([], null));
  },
};
