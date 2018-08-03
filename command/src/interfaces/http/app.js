const debug = require('debug')('microservice:command:rest-api');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const compression = require('compression');
const responseTime = require('response-time');

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

debug('Starting HTTP endpoints');

const app = express();
app.use(compression());
// Add a X-Response-Time header to responses.
app.use(responseTime());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));
app.use(pino);

function runApp(commandHandler, logger, callback) {
  let port = 3000;
  if (process.env.API_PORT) {
    port = parseInt(process.env.API_PORT, 10);
  }

  app.all('*', (req, res, next) => {
    if (!req.headers['x-request-id']) {
      throw new HTTPRequestShouldHaveXRequestID('All incoming HTTP requests should have X-Request-Id header');
    }
    next();
  });

  app.post(
    '/demandes-financement', ensureLoggedIn,
    (req, res, next) => {
      // create command
      const command = {
        name: 'createDemandeFinancement',
        timestamp: Date.now(),
        user: req.user,
        data: req.body,
      };

      return commandHandler.demandeFinancement.create(command).then((events) => {
        const creationEvent = events.find(event => event.type === 'DemandeFinancementCreated');
        res.setHeader('Location', `/demandes-financement/${creationEvent.aggregateId.id}`);
        req.body.aggregateId = creationEvent.aggregateId;
        res.status(201).json(req.body);
      }).catch(next);
    },
  );

  app.put(
    '/demandes-financement/:identifier/montantDemande', ensureLoggedIn,
    (req, res, next) => {
      // create command
      const command = {
        name: 'addMontantDemande',
        timestamp: Date.now(),
        user: req.user,
        id: req.params.identifier,
        data: req.body,
      };

      return commandHandler.demandeFinancement.addMontantDemande(command).then(() => {
        res.status(202).json(req.body);
      }).catch(next);
    },
  );

  app.delete(
    '/demandes-financement/:identifier',
    ensureLoggedIn,
    (req, res, next) => {
      // create command
      const command = {
        name: 'deleteDemandeFinancement',
        timestamp: Date.now(),
        user: req.user,
        id: req.params.identifier,
      };

      return commandHandler.demandeFinancement.delete(command).then(() => {
        res.status(204).send();
      }).catch(next);
    },
  );

  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */
  // HTTP 500 is for non managed exceptions
  app.use((err, req, res, next) => {
    const error = err;
    if (error.statusCode === 404 && req.method === 'DELETE') {
      error.statusCode = 204;
    }
    res.status(error.statusCode ||
    /* istanbul ignore next: for unmanaged errors */
    500).json({
      detail: {
        message: error.message,
        stack: error.stack,
      },
    });
  });

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
