const debug = require('debug')('microservice:query:rest-api:sse:connection');

/**
 * A Connection is a simple SSE manager for 1 client.
 */
class SSEConnection {
  constructor(res) {
    debug(' sseMiddleware construct connection for response ');
    this.res = res;
  }

  setup() {
    debug('set up SSE stream for response');
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    // use 10s heart beat interval
    this.heartBeat = setInterval(() => {
      this.res.write('event: ping\n\n');
    }, 10000);
    this.res.on('finish', () => clearInterval(this.heartBeat));
    this.res.on('close', () => clearInterval(this.heartBeat));
  }

  only(aggregateId) {
    this.aggregateId = aggregateId;
  }

  getAggregateId() {
    return this.aggregateId;
  }

  send(data) {
    debug(`send event to SSE stream ${JSON.stringify(data)}`);
    this.res.write(`event: ${data.type}\n`);
    this.res.write(`id: ${data.id}\n`);
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

module.exports = SSEConnection;

