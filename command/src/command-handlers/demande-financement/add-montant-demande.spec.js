const chai = require('chai');

const Infrastructure = require('../../modules/infrastructure');
const Domain = require('../../modules/domain');

const fakeLogger = {
  info: () => (undefined), // console.info,
};
const fakeEventStore = Infrastructure.EventStore.create(fakeLogger);
const fakePublisher = Infrastructure.EventPublisher.create(fakeLogger);
const fakeRepository = {
  getById: function getById() {
    return {};
  },
  getAllEvents: function getAllEvents() {
    return [];
  },
};

let AddMontantDemandeCommand = require('./add-montant-demande')(Domain.DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);

describe('Commands', () => {
  describe('Add "Montant Demande"', () => {
    describe('Validation', () => {
      it('When command have no name Then return an error', async () => {
        try {
          const result = await AddMontantDemandeCommand({});
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no timestamp Then return an error', async () => {
        try {
          const result = await AddMontantDemandeCommand({
            name: 'addMontantDemande',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no user Then return an error', async () => {
        try {
          const result = await AddMontantDemandeCommand({
            name: 'addMontantDemande',
            timestamp: Date.now(),
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have id Then return an error', async () => {
        try {
          const result = await AddMontantDemandeCommand({
            name: 'addMontantDemande',
            timestamp: Date.now(),
            user: new Domain.UserId('test-user@example.js'),
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When data are not an object Then return an error', async () => {
        try {
          const result = await AddMontantDemandeCommand({
            name: 'addMontantDemande',
            timestamp: Date.now(),
            user: new Domain.UserId('test-user@example.js'),
            id: '12345',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
    });
    describe('Permissions', () => {
      beforeEach(() => {
        fakeEventStore.append(new Domain.EventDemandeFinancementCreated(
          new Domain.DemandeFinancementId('abcdef'),
          'me@example.fr',
          {},
        ));
        AddMontantDemandeCommand = require('./add-montant-demande')(Domain.DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);
      });
      it('When permission is deny Then Fail', async () => {
        try {
          const result = await AddMontantDemandeCommand({
            name: 'addMontantDemande',
            timestamp: Date.now(),
            user: new Domain.UserId('privileges-decision@example.com'),
            id: 'abcdef',
            data: {
              ttc: -1,
            },
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.equal(err.type, 'ErrorDomainValidation');
        }
      });
    });
  });
});
