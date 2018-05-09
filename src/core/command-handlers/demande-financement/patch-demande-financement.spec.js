const chai = require('chai');

const eventsStoreModule = require('../../infrastructure/event-store');
const eventPublisherModule = require('../../infrastructure/event-publisher');

const DemandeFinancementId = require('../../domain/demande-financement-id');
const DemandeFinancement = require('../../domain/demande-financement');

// errors
const ErrorPermissions = require('../../domain/ErrorPermissions');

//events
const DemandeFinancementCreated = require('../../domain/events/demande-financement-created');

const fakeLogger = {
  info: console.info,
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
const fakePermissionAuthority = {
  canCreateDemandeFinancement: function getById() {
    throw new ErrorPermissions('Test error management');
  },
  canPatchDemandeFinancement: function getAllEvents() {
    throw new ErrorPermissions('Test error management');
  }
};

let PatchDemandeFinancementCommand = require('./patch-demande-financement')
  (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakePermissionAuthority, fakeLogger);

describe('Patch-Demande-financement Command', () => {
  describe('Command Validation', () => {
    it('When command have no name Then return an error', async () => {
      try {
        const result = await PatchDemandeFinancementCommand({});
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
    it('When command have no timestamp Then return an error', async () => {
      try {
        const result = await PatchDemandeFinancementCommand({
          name: 'patchDemandeFinancement',
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
    it('When command have no user Then return an error', async () => {
      try {
        const result = await PatchDemandeFinancementCommand({
          name: 'patchDemandeFinancement',
          timestamp: Date.now(),
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
    it('When command have id Then return an error', async () => {
      try {
        const result = await PatchDemandeFinancementCommand({
          name: 'patchDemandeFinancement',
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
        const result = await PatchDemandeFinancementCommand({
          name: 'patchDemandeFinancement',
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
      PatchDemandeFinancementCommand = require('./patch-demande-financement')
      (DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakePermissionAuthority, fakeLogger);
    });
    it('When Patch a read-only-property Then Fail', async () => {
      try {
        const result = await PatchDemandeFinancementCommand({
          name: 'patchDemandeFinancement',
          timestamp: Date.now(),
          user: {
            id: 'privileges-decision@example.com',
          },
          id: 'abcdef',
          data: [
            { op: 'add', path: '/readOnlyProperty', value: 'a value' },
            { op: 'add', path: '/otherProperty', value: 'another value' },
          ]
        });
        chai.assert.fail(result);
      } catch (err) {
        chai.assert.isOk(true);
      }
    });
  });
});
