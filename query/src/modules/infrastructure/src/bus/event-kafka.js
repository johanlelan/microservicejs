import Debug from 'debug';
import kafka from 'kafka-node';

const debug = Debug('microservice:infrastructure:bus:events:kafka');

const topic = 'demandes-financement';

const KafkaService = {
  connect: (publisher, eventStore, logger) => {
    debug('Establishing Kafka connection...');
    const client = new kafka.Client(process.env.KAFKA_URL || 'http://localhost:2181', 'my-client-id', {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    });

    const producer = new kafka.HighLevelProducer(client);
    producer.on('ready', () => {
      logger.info('Kafka Producer is connected and ready.');
      publisher.onAny((event) => {
        logger.info(`Propagate event ${event.name}`);
        // Create a new payload
        const record = [
          {
            topic: `${topic}.events.out`,
            messages: Buffer.from(JSON.stringify(event)),
            attributes: 1, /* Use GZip compression for the payload */
            // TODO JLL: see if content-type should be sent
            // contentType: 'application/json'
          },
        ];
        // Send record to Kafka and log result/error
        return producer.send(record, err => (err ? Promise.reject(err) : Promise.resolve()));
      });
    }).on('error', (error) => {
      logger.error('Error on producer', error);
    });

    const topics = [
      {
        topic: `${topic}.events.in`,
      },
    ];
    const options = {
      autoCommit: true,
      fetchMaxWaitMs: 1000,
      fetchMaxBytes: 1024 * 1024,
      encoding: 'buffer',
    };

    const consumer = new kafka.HighLevelConsumer(client, topics, options);

    consumer.on('message', (message) => {
      function saveEvent(event) {
        eventStore.append(JSON.parse(event.content));
        logger.info(`Append event ${event.name} into eventStore`);
        return Promise.resolve();
      }
      logger.info('Kafka consumer recieves a new event', message);
      // Read string into a buffer.
      const buf = Buffer.from(message.value, 'binary');
      const decodedMessage = JSON.parse(buf.toString());

      // Events is a Sequelize Model Object.
      const event = {
        name: decodedMessage.name,
        id: decodedMessage.id,
        type: decodedMessage.type,
        // TODO JLL: should use type instead of name into event
        userId: decodedMessage.userId,
        sessionId: decodedMessage.sessionId,
        data: JSON.stringify(decodedMessage.data),
        createdAt: new Date(),
      };
      return saveEvent(event);
    }).on('error', (err) => {
      logger.error('Error on consumer', err);
    });
    logger.info('Event Kafka connection established');
  },
};

export default KafkaService;
