/* eslint no-underscore-dangle: ["error", { "allow": ["_active"] }] */

const debug = require('debug')('rest-api');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

const Domain = require('../../modules/domain');
const Infrastructure = require('../../modules/infrastructure');

debug('Starting HTTP endpoints');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));
app.use(pino);

function runApp(eventStore, logger, callback) {
  const repository = Infrastructure.Repository.create(Domain.DemandeFinancement, eventStore);
  let port = 3001;
  if (process.env.API_PORT) {
    port = parseInt(process.env.API_PORT, 10);
  }

  app.all('*', (req, res, next) => {
    if (!req.headers['x-request-id']) {
      throw new HTTPRequestShouldHaveXRequestID('All incoming HTTP requests should have X-Request-Id header');
    }
    next();
  });

  app.get(
    '/demandes-financement/:identifier',
    ensureLoggedIn,
    (req, res) => {
      // 404 Not Found should be send if aggregate is not found
      const aggregate = repository.getById(new Domain.DemandeFinancementId(req.params.identifier));
      if (!aggregate._active) {
        // deleted === 410 Gone
        return res.status(410).json(aggregate);
      }
      return res.status(200).json(aggregate);
    },
  );

  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */
  app.use((err, req, res, next) => res.status(err.statusCode ||
    /* istanbul ignore next: for unmanaged errors */
    500).json({
    detail: {
      message: err.message,
      stack: err.stack,
    },
  }));

  return app.listen(port, () => {
    debug(`Listening on port http://localhost:${port}!`);
    debug(`API http://localhost:${port}/demandes-financement`);
    return callback();
  });
}

module.exports = {
  app,
  run: runApp,
};
