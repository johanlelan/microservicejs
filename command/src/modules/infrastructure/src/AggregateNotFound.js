module.exports = function UnknownAggregate(message, detail) {
  Error.captureStackTrace(this, this.constructor);
  this.type = this.constructor.name;
  this.message = message;
  this.detail = detail;
  this.statusCode = 404;
};

require('util').inherits(module.exports, Error);
