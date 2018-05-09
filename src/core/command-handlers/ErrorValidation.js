module.exports = function CustomError(message, detail) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.detail = detail;
  this.statusCode = 400;
};

require('util').inherits(module.exports, Error);
