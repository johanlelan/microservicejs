const debug = require('debug')('rest-api');
const express = require('express');
const bodyParser = require('body-parser');

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

debug('Starting HTTP endpoints');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));

function runApp(commandHandler, callback) {
  let port = 3000;
  if (process.env.API_PORT) {
    port = parseInt(process.env.API_PORT, 10);
  }

  app.all('*', (req, res, next) => {
    if (!req.headers['x-request-id']) {
      throw new HTTPRequestShouldHaveXRequestID('All incoming HTTP requests should have X-Request-Id header');
    }
    debug(`Starting on ${req.method} ${req.originalUrl} ${req.headers['x-request-id']}`);
    next();
    debug(`Ending ${req.headers['x-request-id']}`);
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
        res.setHeader('Location', `/demandes-financement/${result.id}`);
        res.status(201).json(result);
      }).catch(next);
    },
  );

  app.patch(
    '/demandes-financement/:identifier', ensureLoggedIn,
    (req, res, next) => {
      // create command
      const command = {
        name: 'patchDemandeFinancement',
        timestamp: Date.now(),
        user: req.user,
        id: req.params.identifier,
        data: req.body,
      };

      return commandHandler.demandeFinancement.patch(command).then((result) => {
        res.status(200).json(result);
      }).catch(next);
    },
  );

  app.use((err, req, res, next) => {
    res.status(err.statusCode).json({
      detail: err,
    });
    return next();
  });

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
