const debug = require('debug')('microservice:query:rest-api:sse:clients');
/**
 * A Connection is a simple SSE manager for 1 client.
 */
class SSEClients {
  constructor() {
    debug('init SSE clients');
    this.clients = [];
  }

  add(conn) {
    this.clients.push(conn);
    debug('New client connected, now: ', this.clients.length);
    conn.res.on('close', () => {
      const connectionIndex = this.clients.indexOf(conn);
      if (connectionIndex >= 0) {
        this.clients.splice(connectionIndex, 1);
      }
      debug('Client disconnected, now: ', this.clients.length);
    });
  }

  forEach(cb) {
    this.clients.forEach(cb);
  }
}

module.exports = SSEClients;

