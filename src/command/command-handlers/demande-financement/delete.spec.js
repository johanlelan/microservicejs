const chai = require('chai');

const eventsStoreModule = require('../../../infrastructure/event-store');
const eventPublisherModule = require('../../../infrastructure/event-publisher');
const repositoryModule = require('../../repositories/repository');

const DemandeFinancementId = require('../../../domain/demande-financement-id');
const DemandeFinancement = require('../../../domain/demande-financement');

// errors
const ErrorPermissions = require('../../../domain/ErrorPermissions');

//events
const DemandeFinancementCreated = require('../../../domain/event-demande-financement-created');

const fakeLogger = {
  info: () => (undefined), //console.info,
}
const fakeEventStore = eventsStoreModule.create(fakeLogger);
const fakePublisher = eventPublisherModule.create(fakeLogger);
const fakeRepository = repositoryModule.create(DemandeFinancement, fakeEventStore);

let DeleteDemandeFinancement = require('./delete')
  (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);

describe('Commands', () => {
  describe('Delete DemandeFinancement', () => {
    describe('Command Validation', () => {
      it('When command have no name Then return an error', async () => {
        try {
          const result = await DeleteDemandeFinancement({});
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no timestamp Then return an error', async () => {
        try {
          const result = await DeleteDemandeFinancement({
            name: 'deleteDemandeFinancement',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no user Then return an error', async () => {
        try {
          const result = await DeleteDemandeFinancement({
            name: 'deleteDemandeFinancement',
            timestamp: Date.now(),
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have id Then return an error', async () => {
        try {
          const result = await DeleteDemandeFinancement({
            name: 'deleteDemandeFinancement',
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
    });

    describe('Permissions', () => {
      beforeEach(() => {
        fakeEventStore.append(
          new DemandeFinancementCreated(
            new DemandeFinancementId('abcdef'), 
            {
              id: 'me@example.fr',
              title: 'me',
            },
            {}
          ));
        DeleteDemandeFinancement = require('./delete')
        (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);
      });
      it('When deleter is different from author Then deletion is deny', async () => {
        try {
          const result = await DeleteDemandeFinancement({
            name: 'deleteDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
            id: 'abcdef',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.equal(err.name, 'ErrorPermissions');
        }
      });
    });
  });
});