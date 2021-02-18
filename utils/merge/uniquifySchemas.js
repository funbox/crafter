const equal = require('fast-deep-equal');

module.exports = function uniquifySchemas(schemaVariants) {
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
};
