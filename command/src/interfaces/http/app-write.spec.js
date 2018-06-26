process.env.NODE_ENV = 'test';

const request = require('request');
const chai = require('chai');

require('../../../../test/init.spec');

const should = chai.should();

const username = 'admin';
const password = 'nimda';

describe('WRITE API', () => {
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
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      json: {
        objet: 'Demande de financement',
        montant: {
          ttc: 1234.56,
        },
      },
      headers: {
        'X-Request-Id': '2',
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
        'X-Request-Id': '3',
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
  it('Should return 404 on MontantDemande when unkonwn Demande-Financement', (done) => {
    const options = {
      method: 'PUT',
      uri: 'http://localhost:3000/demandes-financement/unknown/montantDemande',
      json: [],
      headers: {
        'X-Request-Id': '4',
      },
    };
    return request(options, (err, resp, body) => {
      should.not.exist(err);
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
        'X-Request-Id': '5',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('aggregateId');
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
        'X-Request-Id': '6',
      },
    };
    return request(options, (err, resp) => {
      chai.expect(resp).have.property('statusCode', 422);
      done(err);
    }).auth(username, password);
  });
  it('Add MontantDemande to an existing DemandeFinancement', (done) => {
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
        'X-Request-Id': '7',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('aggregateId');
      const montantDemandeOptions = {
        method: 'PUT',
        uri: `http://localhost:3000${resp.headers.location}/montantDemande`,
        json: [
          { op: 'add', path: '/title', value: 'my title' },
          { op: 'replace', path: '/motant/ttc', value: 6543.21 },
        ],
        headers: {
          'X-Request-Id': '7.1',
        },
      };
      return request(montantDemandeOptions, (errPUT, respPUT) => {
        chai.expect(respPUT).have.property('statusCode', 202);
        done(errPUT);
      }).auth(username, password);
    }).auth(username, password);
  });
  it('Add an invalid MontantDemande to an existing DemandeFinancement', (done) => {
    const options = {
      method: 'POST',
      uri: 'http://localhost:3000/demandes-financement',
      body: {
        objet: 'Demande de financement',
        montantDemande: {
          ttc: 1234.56,
        },
      },
      json: true,
      headers: {
        'X-Request-Id': '8',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('aggregateId');
      const montantDemandeOptions = {
        method: 'PUT',
        uri: `http://localhost:3000${resp.headers.location}/montantDemande`,
        json: { ttc: -1 },
        headers: {
          'X-Request-Id': '8.1',
        },
      };
      return request(montantDemandeOptions, (errPUT, respPUT, bodyPUT) => {
        chai.expect(respPUT).have.property('statusCode', 422);
        chai.expect(bodyPUT).have.property('detail');
        chai.expect(bodyPUT.detail).have.property('message', 'Could not set a negative "MontantDemande"');
        done(errPUT);
      }).auth(username, password);
    }).auth(username, password);
  });
  it('Delete a DemandeFinancement', (done) => {
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
        'X-Request-Id': '9',
      },
    };
    return request(options, (err, resp, body) => {
      chai.expect(body).have.property('aggregateId');
      const deleteDemandeFinancementOptions = {
        method: 'DELETE',
        uri: `http://localhost:3000${resp.headers.location}`,
        headers: {
          'X-Request-Id': '9.1',
        },
      };
      return request(deleteDemandeFinancementOptions, (errDELETE, respDELETE) => {
        chai.expect(respDELETE).have.property('statusCode', 204);
        done(errDELETE);
      }).auth(username, password);
    }).auth(username, password);
  });
  it('Should return 204 on DELETE when unkonwn Demande-Financement', (done) => {
    const options = {
      method: 'DELETE',
      uri: 'http://localhost:3000/demandes-financement/unknown',
      json: [],
      headers: {
        'X-Request-Id': '10',
      },
    };
    return request(options, (err, resp) => {
      should.not.exist(err);
      chai.expect(resp).have.property('statusCode');
      chai.expect(resp.statusCode).to.equal(204);
      done(err);
    }).auth(username, password);
  });
});
