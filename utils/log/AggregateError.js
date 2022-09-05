// something like this https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError
class AggregateError {
  constructor(errors, message) {
    this.message = message;
    this.errors = errors;
  }
}

module.exports = AggregateError;
