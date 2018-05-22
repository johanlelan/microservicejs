const amqp = require('amqplib');

const logger = {
  debug: () => (undefined), //console.debug,
  info: () => (undefined), //console.info,
  warn: () => (undefined), //console.warn,
}

// override AMQP lib static functions
const mockBus = require('./mock-amqp.spec');

const handlers = require('../src/command/command-handlers/index');
const chai = require('chai');

const eventStore = require('../src/infrastructure/event-store').create(logger);
const publisher = require('../src/infrastructure/event-publisher').create(logger);
const writeAPI = require('../src/interfaces/http//write-api/app');

const readAPI = require('../src/interfaces/http/read-api/app');

// save all events into events store
publisher.onAny(event => eventStore.append(event));

let init = false;
let ending = false;

let connection = 0;
// first connection will throw an error
// second will be good
// third connection will throw an error
// and so forth
mockBus.stub.callsFake(() => {
  if (connection === 0) {
    connection = 1;
    return Promise.reject({ message: 'Mock a connect error'});
  } else if (connection === 1) {
    connection = 2;
    return Promise.resolve(mockBus.connect);
  } else if (connection === 2) {
    connection = 3;
    return Promise.reject({ message: 'Mock a connect error'});
  }
  return Promise.resolve(mockBus.connect);
});
before((donePreparing) => {
  if (init) return donePreparing();
  // wait until app is started
  // first connection will fail
  amqp.connect().then((bus) => {
    chai.assert.fail('Should fail on first connection');
  }).catch(() => {
    chai.assert.isOk(true);
    amqp.connect()
    .then(bus => bus.createChannel())
    .then(channel => {
      // create command handler
      handlers(eventStore, publisher, logger, channel)
      .then(commandHandler => {
        //console.log('[HTTP] start express app');
        return readAPI.run(eventStore, logger,
          (err) => {
            if (err) return donePreparing(err);
            return writeAPI.run(commandHandler, logger,
            () => {
              init = true;
              return donePreparing();
            });
          });
      });
    })
    .catch(donePreparing);
  });
});
after((doneCleaning) => {
  if (ending) return doneCleaning();
  process.env.API_PORT = 3002;
  writeAPI.run(undefined, logger, err => {
    if (err) return doneCleaning(err);
    process.env.API_PORT = 3003;
    amqp.connect().then(bus => bus.createChannel())
    .then(channel => {
      return readAPI.run(channel, eventStore, err => {
        ending = true;
        return doneCleaning(err)
      });
    })
    .catch(doneCleaning);
  });
});