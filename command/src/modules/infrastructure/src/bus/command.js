const debug = require('debug')('microservice:infrastructure:bus:commands');

exports.create = (IBus) => {
  const connect = (handler, logger, err) => {
    if (err && err.message !== 'Connection closing') {
      logger.error('[Bus] [Command] connection failed (waiting for reconnection)', err.message);
      return connect(handler, logger);
    }
    return IBus.connect(handler, logger)
      .then((connection) => {
        debug('Command Bus created');
        logger.info('[Bus] [Command] connection established');
        return connection;
      })
      .catch(errConn => connect(handler, logger, errConn));
  };

  return {
    connect,
  };
};
