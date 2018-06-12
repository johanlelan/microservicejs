const hydrateProcessor = require('./hydrate-processor');
const chai = require('chai');

describe('Hydrate Processor', () => {
  const EventA = function EventA() {
    this.type = 'EventA';
    this.userId = 'UserA';
  };

  const EventB = function EventB() {
    this.type = 'EventB';
    this.valueB = 'ValueB';
  };

  it('When register Event Then call action on apply of this event', () => {
    const projection = hydrateProcessor.create().register(EventA, function register() {
      this.isCalled = true;
    }).apply(new EventA());

    chai.assert.isOk(projection.isCalled);
  });

  it('Given several event registered When apply Then call good handler for each event', () => {
    const projection = hydrateProcessor.create().register(EventA, function register(event) {
      this.userId = event.userId;
    }).register(EventB, function register(event) {
      this.valueB = event.valueB;
    }).apply([new EventA(), new EventB()]);

    chai.expect(projection.userId).to.equal('UserA');
    chai.expect(projection.valueB).to.equal('ValueB');
  });

  it('When apply an event not registered Then nothing', () => {
    const projection = hydrateProcessor.create().apply(new EventA());

    chai.assert.isUndefined(projection.userId);
  });
});
