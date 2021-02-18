const Flags = require('../../Flags');

module.exports = function mergeFlags(baseFlags, typeElement, options = { propagateFixedType: true }) {
  const typeElementAttributes = typeElement.typeAttributes || [];
  const typeElementPropagatedAttributes = typeElement.propagatedTypeAttributes || [];

  return new Flags({
    isFixed: baseFlags.isFixed || typeElementAttributes.includes('fixed') || typeElementPropagatedAttributes.includes('fixed'),
    isFixedType: (options.propagateFixedType && baseFlags.isFixedType) || typeElementAttributes.includes('fixedType') || typeElementPropagatedAttributes.includes('fixedType'),
    isNullable: typeElementAttributes.includes('nullable'),
    skipTypesInlining: baseFlags.skipTypesInlining,
  });
};
