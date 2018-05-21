const pino = require('pino')();

exports.info = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.info(params);
};

exports.warn = function wrap(...args) {
  const params = [...args].splice(0);
  return pino.warn(params);
};
