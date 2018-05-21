const uuid = require('uuid');

exports.generate = function generate() {
  return uuid.v4();
};
