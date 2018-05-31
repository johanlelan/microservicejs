const events = require('./src/bus/event');
const EventPublisher = require('./src/event-publisher');
const EventStore = require('./src/event-store');
const idGenerator = require('./src/idGenerator');
const HydrateProcessor = require('./src/hydrate-processor');
const logger = require('./src/logger');
const Repository = require('./src/repository');

module.exports = {
  bus: {
    events,
  },
  EventPublisher,
  EventStore,
  idGenerator,
  HydrateProcessor,
  logger,
  Repository,
};
