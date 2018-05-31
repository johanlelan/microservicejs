module.exports = function EventDontContainsAuthor(message, detail) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.detail = detail;
};

require('util').inherits(module.exports, Error);