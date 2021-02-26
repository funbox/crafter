const makeStringElement = require('./makeStringElement');

module.exports = function buildPrototypeElements(protoNames, protoNamesOffset, node, context) {
  const protoElements = [];

  if (protoNames) {
    let protoOffset = protoNamesOffset;
    const SEP = ',';
    protoNames.split(SEP).forEach(proto => {
      const trimmedProto = proto.trim();
      if (trimmedProto) {
        const protoElement = makeStringElement(
          trimmedProto,
          protoOffset + proto.indexOf(trimmedProto),
          node,
          context,
        );
        protoElements.push(protoElement);
      }
      protoOffset += proto.length + SEP.length;
    });
  }

  return protoElements;
};
