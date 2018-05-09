const eventPublisher = require('./event-publisher');
const chai = require('chai');

const EventA = function EventA() {
  this.value = 5;
};
const EventB = function EventB() { };
const EventC = function EventC() { };

const fakeLogger = {
  info: console.info,
};

describe('EventPublisher', () => {
  let publisher;
  beforeEach(() => {
    publisher = eventPublisher.create(fakeLogger);
  });

  it('Given different handlers When publish Then call right handler', () => {
    let eventBReceived = false;
    publisher.on(EventB, () => {
      eventBReceived = true;
    });

    publisher.publish(new EventB());

    chai.assert.isOk(eventBReceived);
  });

  it('Given handler When publish Then pass event to action', () => {
    let eventReceived;
    publisher.on(EventA, (event) => {
      eventReceived = event;
    });

    publisher.publish(new EventA());

    chai.expect(eventReceived.value).to.equal(5);
  });


  it('Given handler When publish Then call handler', () => {
    let called = false;
    publisher.on(EventC, () => {
      called = true;
    });

    publisher.publish(new EventC());

    chai.assert.isOk(called);
  });

  it('Given handler on all events When publish Then handler is called for all events', () => {
    let calledNb = 0;
    publisher.onAny(() => {
      calledNb += 1;
    });

    publisher.publish(new EventA());
    publisher.publish(new EventB());
    publisher.publish(new EventC());

    chai.expect(calledNb).to.equal(3);
  });

  it('Given several global handlers When publish Then all handlers are called', () => {
    let handler1Called = false;
    publisher.onAny(() => {
      handler1Called = true;
    });
    let handler2Called = false;
    publisher.onAny(() => {
      handler2Called = true;
    });

    publisher.publish(new EventA());

    chai.assert.isOk(handler1Called);
    chai.assert.isOk(handler2Called);
  });
});
