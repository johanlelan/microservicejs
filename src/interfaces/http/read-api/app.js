const debug = require('debug')('rest-api');
const express = require('express');
const bodyParser = require('body-parser');

const HTTPRequestShouldHaveXRequestID = require('./errors/HTTPRequestShouldHaveXRequestID');
const ensureLoggedIn = require('./middlewares/ensure-logged-in');

const DemandeFinancement = require('../../../domain/demande-financement');
const DemandeFinancementId = require('../../../domain/demande-financement-id');
const Repository = require('../../../query/core/repositories/repository');

const queue = 'demandes-financement';

debug('Starting HTTP endpoints');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));

function initChannel(channel, eventStore) {
  // start channel listener
  return channel.assertQueue(`${queue}.out`, { durable: true, exclusive: true, autoDelete: false })
    .then(() => channel.prefetch(1))
    .then(() => channel.consume(`${queue}.out`, event => eventStore.append(event.payload), { noAck: true }));
}

function runApp(channel, eventStore, callback) {
  const repository = Repository.create(DemandeFinancement, eventStore);
  let port = 3001;
  if (process.env.API_PORT) {
    port = parseInt(process.env.API_PORT, 10);
  }

  app.all('*', (req, res, next) => {
    if (!req.headers['x-request-id']) {
      throw new HTTPRequestShouldHaveXRequestID('All incoming HTTP requests should have X-Request-Id header');
    }
    debug(`${req.headers['x-request-id']} - Starting request ${req.method} ${req.originalUrl}`);
    next();
    debug(`${req.headers['x-request-id']} - Ending request ${req.method} ${req.originalUrl}`);
  });

  app.get(
    '/demandes-financement/:identifier',
    ensureLoggedIn,
    (req, res) => {
      const aggregate = repository.getById(new DemandeFinancementId(req.params.identifier));
      res.status(200).json(aggregate);
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
    initChannel(channel, eventStore).then(() => callback());
  });
}

module.exports = {
  app,
  run: runApp,
};
