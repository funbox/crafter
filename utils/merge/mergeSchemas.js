const uniquifySchemas = require('./uniquifySchemas');

module.exports = function mergeSchemas(schema1, schema2) {
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
  const propsToOverride = [
    {
      name: 'required',
      action(firstSchema, secondSchema) {
        if (!firstSchema.properties || !secondSchema.properties) return firstSchema.required;

        const firstProperties = Object.keys(firstSchema.properties);
        const secondProperties = Object.keys(secondSchema.properties);

        const optionalOverride = firstProperties
          .filter(property => secondProperties.includes(property)
            && (firstSchema.required.includes(property) && (!secondSchema.required || !secondSchema.required.includes(property))));

        const required = firstSchema.required.filter(property => !optionalOverride.includes(property));

        return required.length > 0 ? required : undefined;
      },
    },
  ];
  const result = { ...schema1 };
  Object.keys(schema2).forEach(key => {
    const propToMerge = propsToMerge.find(prop => (prop === key || (prop.name && prop.name === key)));
    if ((key in result) && propToMerge) {
      if (propToMerge.action) {
        result[key] = propToMerge.action(result[key], schema2[key]);
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
  Object.keys(result).forEach(key => {
    const propToOverride = propsToOverride.find(prop => (prop.name && prop.name === key));
    if (propToOverride) {
      const value = propToOverride.action(result, schema2);
      if (!value) {
        delete result[key];
        return;
      }
      result[key] = value;
    }
  });

  return result;
};
