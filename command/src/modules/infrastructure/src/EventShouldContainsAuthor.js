module.exports = function EventShouldContainsAuthor(message, detail) {
  Error.captureStackTrace(this, this.constructor);
  this.type = this.constructor.name;
  this.message = message;
  this.detail = detail;
};

require('util').inherits(module.exports, Error);
