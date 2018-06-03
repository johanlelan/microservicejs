process.env.NODE_ENV = 'test';

const request = require('request');
const chai = require('chai');

require('../../../../test/init.spec');

const readerLogin = 'reader';
const readerPwd = 'redaer';

const username = 'writer';
const password = 'retirw';

// HTTP port 3001 is for GET requests.
// HTTP port 3000 is for POST/PUT/PATCH requests.
describe('READ API', () => {
  it('Should refuse Force "X-Request-Id" Header', (done) => {
    const options = { json: true };
    return request.get('http://localhost:3001/demandes-financement/12345', options, (err, resp, body) => {
      chai.expect(resp).have.property('statusCode', 400);
      chai.expect(body).have.property('detail');
      chai.expect(body.detail).have.property('message', 'All incoming HTTP requests should have X-Request-Id header');
      done(err);
    });
  });
  it('Should refuse Unauthorized requests', (done) => {
    const options = {
      method: 'GET',
      uri: 'http://localhost:3001/demandes-financement/1',
      headers: {
        'X-Request-Id': '1',
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    });
  });
  it('Should refuse invalid credentials requests', (done) => {
    const options = {
      method: 'GET',
      uri: 'http://localhost:3001/demandes-financement/1',
      headers: {
        'X-Request-Id': '2',
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    }).auth(readerLogin, 'invalidPassword');
  });
  it('Should refuse unknown user', (done) => {
    const options = {
      method: 'GET',
      uri: 'http://localhost:3001/demandes-financement/1',
      headers: {
        'X-Request-Id': '3',
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 401);
      done(err);
    }).auth('unkonwnUser', readerPwd);
  });
  it('Get a DemandeFinancement', (done) => {
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
        'X-Request-Id': 'read-1',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(err).to.be.null;
      chai.expect(body).have.property('aggregateId');
      const location = resp.headers.location;
      const getDemandeFinancementOptions = {
        method: 'GET',
        uri: `http://localhost:3001${location}`,
        headers: {
          'X-Request-Id': 'read-1.1',
        },
      };
      return request(getDemandeFinancementOptions, (err, resp, body) => {
        chai.expect(err).to.be.null;
        chai.expect(resp).have.property('statusCode', 200);
        done(err);
      }).auth(readerLogin, readerPwd);
    }).auth(username, password);
  });
  it('Get a Deleted DemandeFinancement', (done) => {
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
        'X-Request-Id': 'read-1',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(err).to.be.null;
      chai.expect(body).have.property('aggregateId');
      const location = resp.headers.location;
      const deleteOptions = {
        method: 'DELETE',
        uri: `http://localhost:3000${location}`,
        headers: {
          'X-Request-Id': 'read-1',
        },
      };
      return request(deleteOptions, (err, resp, body) => {
        chai.expect(err).to.be.null;
        chai.expect(resp).have.property('statusCode', 204);
        const getDemandeFinancementOptions = {
          method: 'GET',
          uri: `http://localhost:3001${location}`,
          headers: {
            'X-Request-Id': 'read-1.1',
          },
        };
        return request(getDemandeFinancementOptions, (err, resp, body) => {
          chai.expect(err).to.be.null;
          chai.expect(resp).have.property('statusCode', 410);
          done(err);
        }).auth(readerLogin, readerPwd);
      }).auth(username, password);
    }).auth(username, password);
  });
  it('When DemandeFinancementId Does Not Exist Then Return a 404', (done) => {
    const getDemandeFinancementOptions = {
      method: 'GET',
      uri: 'http://localhost:3001/demandes-financement/unknown',
      headers: {
        'X-Request-Id': 'read-2',
      },
    };
    return request(getDemandeFinancementOptions, (err, resp, body) => {
      chai.expect(err).to.be.null;
      chai.expect(resp).have.property('statusCode', 404);
      done(err);
    }).auth(readerLogin, readerPwd);
  });
});
