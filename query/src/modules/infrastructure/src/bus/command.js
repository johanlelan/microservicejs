const debug = require('debug')('messaging');

exports.create = (IBus) => {
  const connect = (handler, publisher, eventStore, logger, err) => {
    if (err && err.message !== 'Connection closing') {
      debug('Command connection failed (waiting for reconnection)', err.message);
      return connect(handler, publisher, eventStore, logger);
    }
    return IBus.connect(handler, publisher, eventStore, logger)
      .then((connection) => {
        debug('Command connection established');
        return connection;
      })
      .catch(errConn => connect(handler, publisher, eventStore, logger, errConn));
  };

  return {
    connect,
  };
};
