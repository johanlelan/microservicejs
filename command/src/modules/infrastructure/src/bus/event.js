const debug = require('debug')('messaging');

exports.create = (IBus) => {
  const connect = (publisher, eventStore, logger, err) => {
    if (err && err.message !== 'Connection closing') {
      debug('Event connection failed (waiting for reconnection)', err.message);
      return connect(publisher, eventStore, logger);
    }
    return IBus.connect(publisher, eventStore, logger)
      .then((connection) => {
        debug('Event connection established');
        return connection;
      })
      .catch(errConn => connect(publisher, eventStore, logger, errConn));
  };

  return {
    connect,
  };
};
