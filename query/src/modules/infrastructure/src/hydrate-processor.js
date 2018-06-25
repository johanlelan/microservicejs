const HydrateProcessor = function HydrateProcessor() {
  const self = this;

  const handlers = {};

  self.register = function register(eventType, action) {
    handlers[eventType.name] = action;

    return self;
  };

  /**
   * Pure (side-effect free) function to compute new state
   * @param {*} initialState initial state
   * @param {*} event new event
   */
  const applyEvent = (initialState, event) => {
    const handler = handlers[event.type];
    if (handler) {
      handler.call(initialState, event);
    }
    return initialState;
  };

  self.apply = function apply(events) {
    if (events instanceof Array) {
      events.forEach(self.apply);
      return self;
    }
    const event = events;
    return applyEvent(self, event);
  };
};

exports.create = function create() {
  return new HydrateProcessor();
};
