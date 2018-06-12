process.env.EVENT_BUS = true;
const chai = require('chai');

// mock all messaging bus functions
class mockEvent {
  constructor() {
    this.name = 'mockEvent';
  }
};
const mockBus = require('../../../../../../test/mock-amqp.spec');
const mockCommandHandler = {
  create: () => { return new mockEvent(); },
  addMontantDemande: () => { return new mockEvent(); },
  delete: () => { return new mockEvent(); },
};
let connection = 0;
const mockAmqp = {
  connect: () => {
    if (connection === 0) {
      connection += 1;
      return Promise.reject({ message: 'Mock a connect error'});
    }
    if (connection === 1) {
      connection += 1;
      return Promise.resolve(mockBus.connect);
    }
    return Promise.resolve(mockBus.connect);
  },
};

const Bus = require('./command');
const commandBus = Bus.create(mockAmqp);

const mockLogger = {
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
};

const mockChannel = mockBus.channelStub;

describe('Command Bus', () => {
  it('Should init a connection', () => commandBus.connect(mockCommandHandler, mockLogger));
  /* describe.skip('When Receiving Demande-financement Commands', () => {
    it('Should manage createDemandeFinancement', () => commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'mockAMQPMessage',
          },
          content: {
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
          },
        }).then(result => {
          chai.assert.isOk(result);
        }));

    it('Should manage addMontantDemande', () => {
      const busMessageHandler = commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        content: {
          name: 'addMontantDemande',
          timestamp: Date.now(),
          user: {
            id: 'any-user@example.com',
          },
          id: {
            id: 'test addMontantDemande from message bus',
          },
          data: {
            ttc: 890.67,
          }
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
    it('Should manage deleteDemandeFinancement', () => {

      const busMessageHandler = commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        content: {
          name: 'deleteDemandeFinancement',
          timestamp: Date.now(),
          user: {
            id: 'test@example.fr',
            title: 'test',
          },
          id: {
            id: 'test deleteDemandeFinancement from message bus',
          }
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
    it('Should manage unknownCommand', () => {
      commandBus.buildMessageHandler(mockCommandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'unknownCommand',
          },
          content: {
            name: 'unknownCommand',
          },
        }).then(result => {
          chai.assert.isOk(result);
        });
    });
  }); */
});
