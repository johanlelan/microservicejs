import debug from 'debug';
import kafka from 'kafka-node';

const topic = 'demandes-financement';

const KafkaService = {
  connect: (handler, publisher, eventStore, logger) => {
    debug('Establishing Kafka connection...');
    const client = new kafka.Client(process.env.KAFKA_URL || 'http://localhost:2181', 'my-client-id', {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    });

    // const producer = new kafka.HighLevelProducer(client);
    // producer.on('ready', () => {
    //   logger.info('Kafka Producer is connected and ready.');
    // });

    // // For this demo we just log producer errors
    // producer.on('error', (error) => {
    //   logger.error('Error on producer', error);
    // });

    const topics = [
      {
        topic: `${topic}.commands.in`,
      },
    ];
    const options = {
      autoCommit: true,
      fetchMaxWaitMs: 1000,
      fetchMaxBytes: 1024 * 1024,
      encoding: 'buffer',
    };

    const consumer = new kafka.HighLevelConsumer(client, topics, options);

    const buildMessageHandler = (msg) => {
      logger.info('[Kafka] new command to proceed');

      const promises = [];

      // A message is a command handler
      // need to run domain logic by command type
      const command = msg && msg.content;
      switch (command.name) {
        case 'createDemandeFinancement':
          promises.push(handler.create(command));
          break;
        case 'addMontantDemande':
          promises.push(handler.addMontantDemande(command));
          break;
        case 'deleteDemandeFinancement':
          promises.push(handler.delete(command));
          break;
        default:
          logger.warn(`Nothing to do with ${command.name}`);
      }
      return Promise.all(promises);
    };

    consumer.on('message', (message) => {
      // Read string into a buffer.
      const buf = Buffer.from(message.value, 'binary');
      const decodedMessage = JSON.parse(buf.toString());

      return buildMessageHandler(decodedMessage);
    });
    consumer.on('error', (err) => {
      logger.info('Error on consumer', err);
    });
  },
};

export default KafkaService;
