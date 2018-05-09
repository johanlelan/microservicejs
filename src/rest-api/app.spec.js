process.env.NODE_ENV = 'test';

const request = require('request');
const chai = require('chai');
const amqp = require('amqplib');
const sinon = require('sinon');

const app = require('./app');
const handlers = require('../core/command-handlers/index');

const logger = require('../core/infrastructure/logger');
const eventStore = require('../core/infrastructure/event-store').create(logger);
const publisher = require('../core/infrastructure/event-publisher').create(logger);

// save all events into events store
publisher.onAny(event => eventStore.append(event));

const username = 'admin';
const password = 'nimda';

// mock amqp
let firstConnect = true;
sinon.stub(amqp, 'connect').callsFake(() => {
  if (firstConnect) {
    firstConnect = false;
    return Promise.reject('Mock a connect error');
  }
  return Promise.resolve(require('../../test/mock-amqp.spec').connect);
});

describe('REST API', () => {
  before((donePreparing) => {
    // wait until app is started
    // first connection will fail
    amqp.connect().then((bus) => {
      chai.assert.fail('Should fail on first connection');
    }).catch(() => {
      chai.assert.isOk(true)
      amqp.connect().then(bus => bus.createChannel())
      .then(channel => {
        // create command handler
        handlers(eventStore, publisher, logger, channel)
        .then(commandHandler => {
          console.log('[HTTP] start express app');
          return app.run(commandHandler, donePreparing)
        });
      });
    });
  });
  it('Should refuse Unauthorized requests', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      json: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      headers: {
        'X-Request-Id': '1'
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    });
  });
  it('Should refuse invalid credentials requests', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      json: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      headers: {
        'X-Request-Id': '2'
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    }).auth(username, 'invalidPassword');
  });
  it('Should refuse unknown user', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      json: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      headers: {
        'X-Request-Id': '3'
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    }).auth('unkonwnUser', password);
  });
  it('Should refuse Force "X-Request-Id" Header', (done) => {
    const options = { json: true };
    return request.post('http://localhost:3000/demandes-financement', options, (err, resp, body) => {
      chai.expect(resp).have.property('statusCode', 400);
      chai.expect(body).have.property('detail');
      chai.expect(body.detail).have.property('message', 'All incoming HTTP requests should have X-Request-Id header');
      done(err);
    });
  });
  it('Should return 404 when unkonwn Demande-Financement', (done) => {
    const options = {
      method: 'PATCH',
      uri: 'http://localhost:3000/demandes-financement/unknown',
      json: [],
      headers: {
        'X-Request-Id': '4'
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(err).to.be.null;
      chai.expect(resp).have.property('statusCode');
      chai.expect(body).have.property('detail');
      chai.expect(body.detail).have.property('message', 'Not Found');
      done(err);
    }).auth(username, password);
  });
  it('Create Demande Financement', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      body: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      json: true,
      headers: {
        'X-Request-Id': '5'
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('id');
      done(err);
    }).auth(username, password);
  });

  it('Should return 400 When Create Demande Financement With invalid Status', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      body: {
        status: 'TRANSMITTED',
      },
      json: true,
      headers: {
        'X-Request-Id': '6'
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(resp).have.property('statusCode', 400);
      done(err);
    }).auth(username, password);
  });

  it('Patch Demande Financement', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      body: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      json: true,
      headers: {
        'X-Request-Id': '7'
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('id');
      const location = resp.headers.location;
      const patchOptions = {
        method: 'PATCH',
        uri: 'http://localhost:3000' + location,
        json: [
          { op: 'add', path: '/title', value: 'my title' },
          { op: 'replace', path: '/motant/ttc', value: 6543.21 }
        ],
        headers: {
          'X-Request-Id': '7.1'
        },
      };
      return request(patchOptions, (err, resp, body) => {
        chai.expect(body).have.property('id');
        done(err);
      }).auth(username, password);
    }).auth(username, password);
  });

  it('Patch Demande Financement with invalid body', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      body: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      json: true,
      headers: {
        'X-Request-Id': '8'
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('id');
      const location = resp.headers.location;
      const patchOptions = {
        method: 'PATCH',
        uri: 'http://localhost:3000' + location,
        json: {},
        headers: {
          'X-Request-Id': '8.1'
        },
      };
      return request(patchOptions, (err, resp, body) => {
        chai.expect(resp).have.property('statusCode', 400);
        chai.expect(body).have.property('detail');
        chai.expect(body.detail).have.property('message', 'Command is invalid');
        done(err);
      }).auth(username, password);
    }).auth(username, password);
  });
});

after((doneCleaning) => {
  process.env.API_PORT = 3002;
  app.run(undefined, err => doneCleaning(err));
});
