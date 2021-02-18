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
};
