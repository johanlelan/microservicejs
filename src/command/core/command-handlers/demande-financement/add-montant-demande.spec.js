const chai = require('chai');

const eventsStoreModule = require('../../infrastructure/event-store');
const eventPublisherModule = require('../../infrastructure/event-publisher');

const DemandeFinancementId = require('../../domain/demande-financement-id');
const DemandeFinancement = require('../../domain/demande-financement');

// errors
const ErrorPermissions = require('../../domain/ErrorPermissions');

//events
const DemandeFinancementCreated = require('../../domain/event-demande-financement-created');

const fakeLogger = {
  info: () => (undefined), //console.info,
}
const fakeEventStore = eventsStoreModule.create(fakeLogger);
const fakePublisher = eventPublisherModule.create(fakeLogger);
const fakeRepository = {
  getById: function getById() {
    return {};
  },
  getAllEvents: function getAllEvents() {
    return [];
  }
};

let AddMontantDemandeCommand = require('./add-montant-demande')
  (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);

describe('Add "Montant Demande" Command', () => {
  describe('Command Validation', () => {
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
          user: {
            id: 'test-user@example.js'
          },
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
    it('When data are not an array Then return an error', async () => {
      try {
        const result = await AddMontantDemandeCommand({
          name: 'addMontantDemande',
          timestamp: Date.now(),
          user: {
            id: 'test-user@example.js'
          },
          id: '12345'
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
  });

  describe('Permissions', () => {
    beforeEach(() => {
      fakeEventStore.append(
        new DemandeFinancementCreated(
          new DemandeFinancementId('abcdef'), 
          'me@example.fr', 
          {}
        ));
      AddMontantDemandeCommand = require('./add-montant-demande')
      (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);
    });
    it('When permission is deny Then Fail', async () => {
      try {
        const result = await AddMontantDemandeCommand({
          name: 'addMontantDemande',
          timestamp: Date.now(),
          user: {
            id: 'privileges-decision@example.com',
          },
          id: 'abcdef',
          data: {
            ttc: -1,
          },
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.equal(err.name, 'ErrorDomainValidation');
      }
    });
  });
});
