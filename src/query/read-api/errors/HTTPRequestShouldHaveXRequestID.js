module.exports = function HTTPRequestShouldHaveXRequestID(message, detail) {
  Error.captureStackTrace(this, this.constructor);
  this.statusCode = 400;
  this.name = this.constructor.name;
  this.message = message;
  this.detail = detail;
};

require('util').inherits(module.exports, Error);
