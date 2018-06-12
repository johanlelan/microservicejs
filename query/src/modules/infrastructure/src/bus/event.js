const debug = require('debug')('microservice:infrastructure:bus:events');

exports.create = (IBus) => {
  debug('Creating events Bus...');
  const connect = (publisher, eventStore, logger, err) => {
    if (err && err.message !== 'Connection closing') {
      logger.error('[BUS] [Event] connection failed (waiting for reconnection)', err.message);
      return connect(publisher, eventStore, logger);
    }
    return IBus.connect(publisher, eventStore, logger)
      .then((connection) => {
        logger.info('[BUS] [Event] connection established');
        return connection;
      })
      .catch(errConn => connect(publisher, eventStore, logger, errConn));
  };

  return {
    connect,
  };
};
