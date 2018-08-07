process.env.EVENT_BUS = true;

// mock all messaging bus functions
class MockEvent {
  constructor() {
    this.type = 'mockEvent';
  }
}
const mockBus = require('../../../../../../test/mock-command.spec');

const mockCommandHandler = {
  create: () => new MockEvent(),
  addMontantDemande: () => new MockEvent(),
  delete: () => new MockEvent(),
};
let connection = 0;
const mockAmqp = {
  connect: () => {
    if (connection === 0) {
      connection += 1;
      return Promise.reject(new Error({ message: 'Mock a connect error' }));
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
  debug: () => (undefined), // console.debug,
  info: () => (undefined), // console.info,
  warn: () => (undefined), // console.warn,
  error: () => (undefined), // console.error,
};

describe('Command Bus', () => {
  it('Should init a connection', () => commandBus.connect(mockCommandHandler, null, mockLogger));
});
