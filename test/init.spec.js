const amqp = require('amqplib');

const logger = {
  debug: () => (undefined), // console.debug,
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
  error: () => (undefined), // console.error,
}

// override AMQP lib static functions
const mockBusEvent = require('./mock-event.spec');
const mockBusCommand = require('./mock-command.spec');

// Domain
const Domain = require('../command/src/modules/domain');

const handlers = require('../command/src/command-handlers/index');
const chai = require('chai');

const eventMessaging = require('../command/src/modules/infrastructure/src/bus/event').create(mockBusEvent);
const commandMessaging = require('../command/src/modules/infrastructure/src/bus/command').create(mockBusCommand);
const eventStore = require('../command/src/modules/infrastructure/src/event-store').create(logger);
const publisher = require('../command/src/modules/infrastructure/src/event-publisher').create(logger);
const repository = require('../command/src/modules/infrastructure/src/repository').create(Domain.DemandeFinancement, eventStore);

const writeAPI = require('../command/src/interfaces/http/app');
const readAPI = require('../query/src/interfaces/http/app');

// save all events into events store
publisher.onAny(event => eventStore.append(event));

let init = false;
let ending = false;

/*
let connection = 0;
// first connection will throw an error
// second will be good
// third connection will throw an error
// and so forth
mockBusCommand.stub.callsFake(() => {
  if (connection === 0) {
    connection = 1;
    return Promise.reject({ message: 'Mock a connect error'});
  } else if (connection === 1) {
    connection = 2;
    return Promise.resolve(mockBusCommand.connect);
  } else if (process.env.API_PORT === 3002) {
    connection = 3;
    return Promise.resolve(mockBusCommand.connect);
  } else if (process.env.API_PORT === 3003) {
    connection = 4;
    return Promise.resolve(mockBusCommand.connect);
  }
  return Promise.resolve(mockBusCommand.connect);
});
mockBusEvent.stub.callsFake(() => {
  if (connection === 0) {
    connection = 1;
    return Promise.reject({ message: 'Mock a connect error'});
  } else if (connection === 1) {
    connection = 2;
    return Promise.resolve(mockBusEvent.connect);
  } else if (process.env.API_PORT === 3002) {
    connection = 3;
    return Promise.resolve(mockBusEvent.connect);
  } else if (process.env.API_PORT === 3003) {
    connection = 4;
    return Promise.resolve(mockBusEvent.connect);
  }
  return Promise.resolve(mockBusEvent.connect);
});
*/
before((donePreparing) => {
  if (init) return donePreparing();
  // wait until app is started
  // first connection will fail
  commandMessaging.connect(undefined, publisher, eventStore, logger).then((bus) => {
    chai.assert.fail('Should fail on first connection');
  }).catch(() => {
    chai.assert.isOk(true);
    return handlers(repository, publisher, logger)
      .then(commandHandler => {
        commandMessaging.connect(commandHandler, publisher, eventStore, logger)
        .then(() => {
          // console.log('[HTTP] start express app');
          return readAPI.run(eventStore, repository, logger,
            (err) => {
              if (err) return donePreparing(err);
              return writeAPI.run(commandHandler, logger,
              () => {
                init = true;
                return donePreparing();
              });
            });
        });
      });
    })
  .catch(donePreparing);
  });

after((doneCleaning) => {
  if (ending) return doneCleaning();
  process.env.API_PORT = 3002;
  writeAPI.run(undefined, logger, err => {
    if (err) return doneCleaning(err);
    process.env.API_PORT = 3003;
    eventMessaging.connect(publisher, eventStore, repository, logger).then(bus => bus.createChannel())
    .then(channel => {
      return readAPI.run(eventStore, repository, logger, err => {
        ending = true;
        return doneCleaning(err)
      });
    })
    .catch(doneCleaning);
  });
});