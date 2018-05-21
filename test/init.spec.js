const amqp = require('amqplib');

const logger = {
  debug: () => (undefined), //console.debug,
  info: () => (undefined), //console.info,
  warn: () => (undefined), //console.warn,
}

// override AMQP lib static functions
const mockamqp = require('./mock-amqp.spec');

const handlers = require('../src/command/core/command-handlers/index');
const chai = require('chai');

const eventStore = require('../src/command/core/infrastructure/event-store').create(logger);
const publisher = require('../src/command/core/infrastructure/event-publisher').create(logger);
const writeAPI = require('../src/command/write-api/app');

const readAPI = require('../src/query/read-api/app');

// save all events into events store
publisher.onAny(event => eventStore.append(event));

let init = false;
let ending = false;
before((donePreparing) => {
  if (init) return donePreparing();
  // wait until app is started
  // first connection will fail
  amqp.connect().then((bus) => {
    chai.assert.fail('Should fail on first connection');
  }).catch(() => {
    chai.assert.isOk(true)
    amqp.connect().then(bus => bus.createChannel())
    .then(channel => {
      // create command handler
      handlers(eventStore, publisher, logger, channel)
      .then(commandHandler => {
        //console.log('[HTTP] start express app');
        return readAPI.run(channel, eventStore,
          (err) => {
            if (err) return donePreparing(err);
            return writeAPI.run(commandHandler, 
            () => {
              init = true;
              return donePreparing();
            });
          });
      });
    });
  });
});
after((doneCleaning) => {
  if (ending) return doneCleaning();
  process.env.API_PORT = 3002;
  writeAPI.run(undefined, err => {
    if (err) return doneCleaning(err);
    process.env.API_PORT = 3003;
    amqp.connect().then(bus => bus.createChannel())
    .then(channel => {
      return readAPI.run(channel, eventStore, err => {
        ending = true;
        return doneCleaning(err)
      });
    });
  });
});