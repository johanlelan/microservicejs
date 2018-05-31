const debug = require('debug')('rest-api');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

debug('Starting HTTP endpoints');

const app = express();
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

      return commandHandler.demandeFinancement.create(command).then((result) => {
        res.setHeader('Location', `/demandes-financement/${result.aggregateId.id}`);
        res.status(201).json(result);
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
        res.status(204).json(req.body);
      }).catch(next);
    },
  );

  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({
    detail: err.message,
    stack: err.stack,
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