const pino = require('pino')();

exports.debug = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.debug(params);
};

exports.info = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.info(params);
};

exports.warn = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.warn(params);
};

exports.error = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.error(params);
};
