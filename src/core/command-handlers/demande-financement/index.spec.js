const chai = require('chai');

const DemandeFinancement = require('../../domain/demande-financement');
const buildCommandHandler = require('./index');
const DemandeFinancementCreated = require('../../domain/event-demande-financement-created');

const mockEventStore = {
  append: (event) => {
    console.log('Append event', event);
  },
  getEventsOfAggregate: (id) => {
    return [
      new DemandeFinancementCreated(id, 'test@example.fr', {}),
    ];
  },
}

const mockPublisher = {
  publish: (event) => {
    console.log('Publish event', event);
  },
  onAny: (event) => {
    console.log('onAny event', event);
  },
}

const mockLogger = {
  info: console.info,
  warn: console.warn,
}

const mockChannel = require('../../../../test/mock-amqp.spec').channelStub;

describe('Demande-financement Commands', () => {
  it('Should manage createDemandeFinancement bus commands', () => {
    return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, mockChannel)
    .then(commandHandler => {
      buildCommandHandler.buildMessageHandler(commandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger)({
          properties: {
            replyTo: 'test-queue',
            correlationId: 'mockAMQPMessage',
          },
          payload: {
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
          },
        }).then(result => {
          chai.assert.isOk(result);
        });  
    });
  });

  it('Should manage patchDemandeFinancement bus commands', () => {
    return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, mockChannel)
    .then(commandHandler => {

      const busMessageHandler = buildCommandHandler.buildMessageHandler(commandHandler, {
        isConnected: true,
        sendToQueue: () => { return chai.assert.isOk(true); }
      }, mockLogger);

      busMessageHandler({
        properties: {
          replyTo: 'test-queue',
          correlationId: 'mockAMQPMessage',
        },
        payload: {
          name: 'patchDemandeFinancement',
          timestamp: Date.now(),
          user: {
            id: 'any-user@example.com',
          },
          id: {
            id: 'test patch from message bus',
          },
          data: [
            { op: 'add', path: '/otherProperty', value: 'another value' },
          ]
        },
      }).then(result => {
        chai.assert.isOk(result);
      });
    });
  });

  describe('When no message bus configured', () => {
    it('Should not consume any messages, should not propagate any events', () => {
      return buildCommandHandler.create(mockEventStore, mockPublisher, mockLogger, {})
      .then(commandHandler => {
        chai.assert.isOk(commandHandler);
      });
    });
  });
});