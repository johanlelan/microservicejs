const debug = require('debug')('microservice:query:rest-api:middleware:sse');
const SSEConnection = require('../utils/sse-connection');

// ... with this middleware:
module.exports = function sseMiddleware(req, res, next) {
  debug(`sseMiddleware is activated with ${req} res: ${res}`);
  res.sseConnection = new SSEConnection(res);
  debug(`res has now connection  res: ${res.sseConnection}`);
  return next();
};
