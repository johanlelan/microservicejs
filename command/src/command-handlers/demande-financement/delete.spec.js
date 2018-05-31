const chai = require('chai');
const Domain = require('../../modules/domain');
const Infrastructure = require('../../modules/infrastructure');

const fakeLogger = {
  info: () => (undefined), // console.info,
};
const fakeEventStore = Infrastructure.EventStore.create(fakeLogger);
const fakePublisher = Infrastructure.EventPublisher.create(fakeLogger);
const fakeRepository = Infrastructure.Repository.create(Domain.DemandeFinancement, fakeEventStore);

let DeleteDemandeFinancement = require('./delete')(Domain.DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);

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
              id: 'test-user@example.js',
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
        fakeEventStore.append(new Domain.EventDemandeFinancementCreated(
          new Domain.DemandeFinancementId('abcdef'),
          {
            id: 'me@example.fr',
            title: 'me',
          },
          {},
        ));
        DeleteDemandeFinancement = require('./delete')(Domain.DemandeFinancement, fakeRepository, fakeEventStore, fakePublisher, fakeLogger);
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
