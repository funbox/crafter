class CrafterError extends Error {
  constructor(message, sourceMap) {
    super(message);
    this.sourceMap = sourceMap;
  }
}

module.exports = CrafterError;
