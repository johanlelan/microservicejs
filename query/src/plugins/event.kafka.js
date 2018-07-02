const debug = require('debug')('microservice:infrastructure:bus:events:kafka');
const kafka = require('kafka-node');
const { KafkaStreams } = require('kafka-streams');

const topic = 'demandes-financement';

const KafkaService = {
  connect: (publisher, eventStore, repository, logger, mode) => {
    const zkOptions = {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    };
    const config = {
      zkConStr: process.env.KAFKA_URL || 'localhost:2181/',
      groupId: 'event-stream',
      workerPerPartition: 1,
      options: {
        sessionTimeout: 8000,
        protocol: ['roundrobin'],
        fromOffset: 'earliest', // latest
        fetchMaxBytes: 1024 * 100,
        fetchMinBytes: 1,
        fetchMaxWaitMs: 10,
        heartbeatInterval: 250,
        retryMinTimeout: 250,
        autoCommit: true,
        autoCommitIntervalMs: 1000,
        requireAcks: 0,
        // ackTimeoutMs: 100,
        // partitionerType: 3
      },
    };
    const client = new kafka.Client(process.env.KAFKA_URL || 'localhost:2181', 'microserviceEventBus', zkOptions);
    client.once('connect', () => {
      debug('Connection established');
    });
    client.createTopics([
      `${topic}.events.out`,
    ], false, (errTopics) => {
      if (errTopics) {
        logger.error('When creating topics', errTopics);
      }
      if (mode === 'COMMAND') {
        config.clientName = 'publisher-event-stream';
        const kafkaStreams = new KafkaStreams(config);
        const stream = kafkaStreams.getKStream();
        stream.to(`${topic}.events.out`);
        stream.start().then(() => {
          publisher.onAny((event) => {
            logger.info(`Propagate event ${event.type}`);
            stream.writeToStream(JSON.stringify(event));
          });
        });
      } else {
        config.clientName = 'query-event-stream';
        const kafkaStreams = new KafkaStreams(config);
        const stream = kafkaStreams.getKStream();

        stream
          .from(`${topic}.events.out`)
          .mapJSONConvenience() // {key: Buffer, value: Buffer} -> {key: string, value: Object}
          .forEach(async (message) => {
            const event = message.value;
            const type = event.type || '';
            let state;
            if (type.indexOf('Created') === -1) {
              // get current state
              state = await repository.getById(event.aggregateId);
              // apply new event
              state.apply(event);
              logger.info(`[Kafka] Apply event on current DB state of Aggregate ${event.aggregateId}`);
            } else {
              // create new state
              state = repository.getAggregate().createFromEvents([event]);
            }
            // save newly state to DB
            repository.save(state);

            return state;
          });
        stream.start();
      }
    });
    logger.info('Event Kafka connection initialized');
    return Promise.resolve();
  },
};

module.exports = KafkaService;
