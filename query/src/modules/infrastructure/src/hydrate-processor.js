const HydrateProcessor = function HydrateProcessor() {
  const self = this;

  const handlers = {};

  self.register = function register(eventType, action) {
    handlers[eventType.name] = action;

    return self;
  };

  self.apply = function apply(events) {
    if (events instanceof Array) {
      events.forEach(self.apply);
      return self;
    }

    const event = events;
    const typeName = event.name;

    const handler = handlers[typeName];
    if (handler) {
      handler.call(self, event);
    }

    return self;
  };
};

exports.create = function create() {
  return new HydrateProcessor();
};
