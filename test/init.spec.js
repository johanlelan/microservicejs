const logger = {
  debug: () => (undefined), // console.debug,
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
  error: () => (undefined), // console.error,
};

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

before((donePreparing) => {
  if (init) {
    donePreparing();
  } else {
  // wait until app is started
  // first connection will fail
    commandMessaging.connect(undefined, logger)
      .then(() => {
        chai.assert.fail('Should fail on first connection');
      })
      .catch(() => {
        chai.assert.isOk(true);
        handlers(repository, publisher, logger)
          .then(commandHandler => commandMessaging.connect(
            commandHandler,
            logger,
          ).then(() =>
          // console.log('[HTTP] start express app');
            readAPI.run(
              repository, logger,
              (err) => {
                if (err) {
                  donePreparing(err);
                } else {
                  writeAPI.run(
                    commandHandler, logger,
                    () => {
                      init = true;
                      return donePreparing();
                    },
                  );
                }
              },
            )));
      })
      .catch(donePreparing);
  }
});

after((doneCleaning) => {
  if (ending) return doneCleaning();
  process.env.API_PORT = 3003;
  return writeAPI.run(undefined, logger, (errWRITE) => {
    if (errWRITE) return doneCleaning(errWRITE);
    process.env.API_PORT = 3004;
    return eventMessaging.connect(publisher, repository, logger)
      .then(bus => bus.createChannel())
      .then(() => readAPI.run(repository, logger, (errREAD) => {
        ending = true;
        return doneCleaning(errREAD);
      }))
      .catch(doneCleaning);
  });
});
