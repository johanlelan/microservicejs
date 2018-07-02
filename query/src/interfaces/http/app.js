/* eslint no-underscore-dangle: ["error", { "allow": ["_active"] }] */

const debug = require('debug')('microservice:query:rest-api');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const Domain = require('../../modules/domain');

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

debug('Starting HTTP endpoints');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));
app.use(pino);

function runApp(eventStore, repository, logger, callback) {
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
    async (req, res, next) => {
      try {
      // 404 Not Found should be send if aggregate is not found
        const state =
        await repository.getById(new Domain.DemandeFinancementId(req.params.identifier));
        if (!state._active) {
        // deleted === 410 Gone
          return res.status(410).json(state);
        }
        return res.status(200).json(state);
      } catch (err) {
        return next(err);
      }
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
    logger.info(`Listening on port http://localhost:${port}!`);
    logger.info(`API http://localhost:${port}/demandes-financement`);
    return callback();
  });
}

module.exports = {
  app,
  run: runApp,
};
