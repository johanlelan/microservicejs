// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

const debug = require('debug')('microservice:query:server');

const Domain = require('./src/modules/domain');

const StateRepositoryModule = require('./src/plugins/repository.state.mongo');

// const concreteEvent = require('./src/modules/infrastructure/src/bus/event.amqp');
const concreteEvent = require('./src/plugins/event.kafka');
const Infrastructure = require('./src/modules/infrastructure');
const readAPI = require('./src/interfaces/http/app');

const publisher = Infrastructure.EventPublisher.create(Infrastructure.logger);
const eventBus = Infrastructure.EventBus.create(concreteEvent);

const SSEClients = require('./src/interfaces/http/utils/sse-clients');

debug('Initializing query server...');

// Mongodb states repository
require('./src/plugins/event-store.mongo')(Infrastructure.logger, process.env.MONGO_URL || 'mongodb://localhost:27017')
  .then(async (EventStoreMongoDB) => {
    const eventStore = EventStoreMongoDB.create('demande-financement');
    const repository = Infrastructure.Repository.create(Domain.DemandeFinancement, eventStore);

    const stateRepository = await StateRepositoryModule(Infrastructure.logger, process.env.MONGO_URL || 'mongodb://localhost:27017')
      .then(StateRepository => StateRepository.create(repository.getAggregate(), 'demande-financement'));

    // every published events should be saved into event-store
    publisher.onAny((event) => {
      eventStore.append(event);
    });
    // every published events should update its previous state
    publisher.onAny(async (event) => {
      const type = event.type || '';
      const aggregateId = event.aggregateId && event.aggregateId.id;
      Infrastructure.logger.info(`Apply event ${type} on state DB for Aggregate ${aggregateId}`);
      let state;
      if (type.indexOf('Created') === -1) {
        // get current state
        state = await repository.getById(event.aggregateId);
        // apply new event
        state.apply(event);
      } else {
        // create new state
        const Aggregate = await repository.getAggregate();
        state = Aggregate.createFromEvents([event]);
      }
      // save newly state to DB
      stateRepository.save(state);
      return state;
    });

    // Realtime updates
    const sseClients = new SSEClients();
    publisher.onAny(async (event) => {
      // send event to all registered SSE Clients
      sseClients.forEach((sseClient) => {
        if (!sseClient.getAggregateId() || sseClient.getAggregateId() === event.aggregateId.id) {
          return sseClient.send(event);
        }
        return sseClient;
      });
    });

    // connect to message broker
    eventBus.connect(publisher, repository, Infrastructure.logger, 'QUERY');

    readAPI.run(repository, Infrastructure.logger, sseClients, (errQuery) => {
      if (errQuery) { throw (errQuery); }
      Infrastructure.logger.info('[Query] HTTP API started');
    });
  });

process.on('unhandledRejection', (error) => {
  // This prints error with stack included (as for normal errors)
  Infrastructure.logger.error(error);
});
