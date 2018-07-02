const debug = require('debug')('microservice:infrastructure:bus:events');

exports.create = (IBus) => {
  /**
   * Connection to event BUS
   * @param {*} publisher : Event publisher used to propagate event into queue/topic
   * @param {*} eventStore : Event store used to save incoming events from queue/topic
   * @param {*} logger : Logger used to trace
   * @param {*} mode : 'QUERY' or 'COMMAND' used to specified behavior.
   * QUERY only starts an events consumer
   * COMMAND only propagate events to BUS
   * @param {*} err : Eventual error for re-connection
   */
  const connect = (publisher, eventStore, repository, logger, mode, err) => {
    if (err && err.message !== 'Connection closing') {
      logger.error('[BUS] [Event] connection failed (waiting for reconnection)', err.message);
      return connect(publisher, eventStore, repository, logger, mode);
    }
    return IBus.connect(publisher, eventStore, repository, logger, mode)
      .then((connection) => {
        debug('Event Bus created');
        logger.info('[BUS] [Event] connection established');
        return connection;
      })
      .catch(errConn => connect(publisher, eventStore, repository, logger, mode, errConn));
  };

  return {
    connect,
  };
};
