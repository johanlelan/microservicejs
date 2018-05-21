const events = require('events');

const EventPublisher = function EventPublisher(logger) {
  const self = this;

  const eventEmitter = new events.EventEmitter();

  self.on = function on(eventType, action) {
    eventEmitter.on(eventType.name, action);

    return self;
  };

  self.onAny = function onAny(action) {
    eventEmitter.on('*', action);

    return self;
  };

  self.publish = function publish(event) {
    eventEmitter.emit('*', event);

    const eventName = event.constructor.name;
    eventEmitter.emit(eventName, event);
    logger.info(`publish - emit ${eventName} event`);
  };
};

exports.create = function create(logger) {
  return new EventPublisher(logger);
};
