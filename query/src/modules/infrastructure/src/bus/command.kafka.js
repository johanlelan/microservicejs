const debug = require('debug')('microservice:infrastructure:bus:commands:kafka');
const kafka = require('kafka-node');

const topic = 'demandes-financement';

const KafkaService = {
  connect: (handler, publisher, eventStore, logger) => {
    debug('Establishing Kafka connection...');
    const zkOptions = {
      sessionTimeout: 300,
      spinDelay: 100,
      retries: 2,
    };
    const client = new kafka.Client(process.env.KAFKA_URL || 'localhost:2181', 'microserviceCommandBus', zkOptions);

    client.createTopics([
      `${topic}.commands.in`,
    ], false, (errTopics) => {
      if (errTopics) {
        logger.error('When creating topics', errTopics);
      }

      // result is an array of any errors if a given topic could not be created
      const options = {
        autoCommit: true,
        fetchMaxWaitMs: 1000,
        fetchMaxBytes: 1024 * 1024,
        encoding: 'buffer',
      };

      const consumer = new kafka.HighLevelConsumer(client, [
        {
          topic: `${topic}.commands.in`,
        },
      ], options);

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
      }).on('error', (err) => {
        logger.error('Error on consumer', err);
      });
    });
    logger.info('Command Kafka connection initialized');
    return Promise.resolve();
  },
};

module.exports = KafkaService;
