/* eslint no-underscore-dangle: ["error", { "allow": ["_active"] }] */

const debug = require('debug')('microservice:query:rest-api');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const compression = require('compression');
const responseTime = require('response-time');

const Domain = require('../../modules/domain');

const ensureLoggedIn = require('./middlewares/ensure-logged-in');
const sseMiddleware = require('./middlewares/server-side-events');

debug('Starting HTTP endpoints');

const app = express();
app.use(compression());
// Add a X-Response-Time header to responses.
app.use(responseTime());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));
app.use(pino);

app.use(sseMiddleware);

function runApp(repository, logger, sseClients, callback) {
  let port = 3001;
  if (process.env.API_PORT) {
    port = parseInt(process.env.API_PORT, 10);
  }

  // propagate all incomming events to clients
  app.get(
    '/demandes-financement/_updates',
    ensureLoggedIn, (req, res) => {
      res.sseConnection.setup();
      sseClients.add(res.sseConnection);
    },
  );

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

  // propagate all aggregate events to clients
  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "req" }] */
  app.get(
    '/demandes-financement/:identifier/_updates',
    ensureLoggedIn, (req, res) => {
      res.sseConnection.setup();
      res.sseConnection.only(req.params.identifier);
      sseClients.add(res.sseConnection);
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
