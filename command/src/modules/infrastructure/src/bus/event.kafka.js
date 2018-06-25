const debug = require('debug')('microservice:infrastructure:bus:events:kafka');
const kafka = require('kafka-node');
const { KafkaStreams } = require('kafka-streams');

const topic = 'demandes-financement';

const KafkaService = {
  connect: (publisher, eventStore, repository, logger, mode) => {
    debug('Establishing Kafka connection...');
    const zkOptions = {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    };
    const client = new kafka.Client(process.env.KAFKA_URL || 'localhost:2181', 'microserviceEventBus', zkOptions);
    client.createTopics([
      `${topic}.events.out`,
    ], false, (errTopics) => {
      if (errTopics) {
        logger.error('When creating topics', errTopics);
      }
      if (mode === 'COMMAND') {
        const producer = new kafka.HighLevelProducer(client, {
          requireAcks: 1,
          partitionerType: 3, // KeyedPartitionner partitionner
        });
        producer.on('ready', () => {
          logger.info('Event Kafka Producer is connected and ready.');
          client.refreshMetadata([
            `${topic}.events.out`,
          ], (error) => {
            if (error) {
              logger.error('When refreshing topic metadata', error);
              throw error;
            }
            publisher.onAny((event) => {
              logger.info(`Propagate event ${event.type}`);
              // Create a new payload
              const records = [
                {
                  topic: `${topic}.events.out`,
                  key: event.aggregateId,
                  messages: [Buffer.from(JSON.stringify(event))],
                  attributes: 1, /* Use GZip compression for the payload */
                // TODO JLL: see if content-type should be sent
                // contentType: 'application/json'
                },
              ];
              // Send record to Kafka and log result/error
              return producer.send(records, (err, result) => {
                if (err) {
                  logger.error('Error on propagate', err);
                  return Promise.reject(err);
                }
                return Promise.resolve(result);
              });
            });
          });
        }).on('error', (err) => {
          logger.error('Error on event producer', err);
        });
      } else {
        const config = {
          zkConStr: process.env.KAFKA_URL || 'localhost:2181/',
          groupId: 'event-stream',
          clientName: 'query-event-stream',
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
        const kafkaStreams = new KafkaStreams(config);
        const stream = kafkaStreams.getKStream();

        stream
          .from(`${topic}.events.out`)
          .mapJSONConvenience() // {key: Buffer, value: Buffer} -> {key: string, value: Object}
          // save incoming event into events store
          .tap(message => eventStore.append(message.value))
          .forEach((message) => {
            const event = message.value;
            // Hydrate aggregate by its events to compute current state
            const state = repository.getById(event.aggregateId);
            logger.info('[Stream] Compute current state of Aggregate', state);
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
