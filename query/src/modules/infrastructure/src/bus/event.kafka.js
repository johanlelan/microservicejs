const debug = require('debug')('microservice:infrastructure:bus:events:kafka');
const kafka = require('kafka-node');
const KafkaStreams = require('kafka-streams');

const config = require('./streams-config.kafka');

const topic = 'demandes-financement';

const KafkaService = {
  connect: (publisher, eventStore, logger, mode) => {
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
        const producer = new kafka.HighLevelProducer(client);
        producer.on('ready', () => {
          logger.info('Event Kafka Producer is connected and ready.');
          publisher.onAny((event) => {
            logger.info(`Propagate event ${event.type}`);
            // Create a new payload
            const records = [
              {
                topic: `${topic}.events.out`,
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
        }).on('error', (err) => {
          logger.error('Error on event producer', err);
        });
      } else {
        const kafkaStreams = new KafkaStreams(config);
        const extractEvent = message => message.value;
        const stream = kafkaStreams.getKStream();
        stream
          .from(`${topic}.events.out`)
          .map(extractEvent)
          .tap(event => logger.info(event))
          .map()
          .to(`${topic}.states.out`);
        stream.start();
      }
    });
    logger.info('Event Kafka connection initialized');
    return Promise.resolve();
  },
};

module.exports = KafkaService;
