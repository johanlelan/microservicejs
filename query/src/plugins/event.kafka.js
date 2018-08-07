const debug = require('debug')('microservice:infrastructure:bus:events:kafka');
const kafka = require('kafka-node');
const { KafkaStreams } = require('kafka-streams');

const topic = 'demandes-financement';

const KafkaService = {
  connect: async (publisher, repository, logger, mode) => {
    const zkOptions = {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    };
    const config = {
      zkConStr: process.env.KAFKA_URL || 'localhost:2181/',
      workerPerPartition: 1,
      options: {
        sessionTimeout: 8000,
        protocol: ['roundrobin'],
        fromOffset: 'earliest', // 'latest'
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
        config.clientName = 'publish-event-stream';
        config.groupId = 'publish-event-stream';
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
        config.groupId = 'query-event-stream';
        const kafkaStreams = new KafkaStreams(config);
        const stream = kafkaStreams.getKStream();

        stream
          .from(`${topic}.events.out`)
          // {key: Buffer, value: Buffer} -> {key: string, value: Object}
          .mapJSONConvenience()
          .forEach(async (message) => {
            const event = message.value;
            if (typeof event !== 'object') {
              logger.info('[Kafka] Can not process message, it is not an object.', message);
              return message;
            }
            // save incoming event
            await repository.save(event);
            return message;
          });
        stream.start();
      }
    });
    logger.info('Event Kafka connection initialized');
    return Promise.resolve();
  },
};

module.exports = KafkaService;
