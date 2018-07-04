const chai = require('chai');
const Domain = require('../../modules/domain');
const Infrastructure = require('../../modules/infrastructure');

const deleteDemandeFinancement = require('./delete');

const fakeLogger = {
  info: () => (undefined), // console.info,
  debug: () => (undefined), // console.debug,
};
const fakeEventStore = Infrastructure.EventStore.create(fakeLogger);
const fakePublisher = Infrastructure.EventPublisher.create(fakeLogger);
const fakeRepository = Infrastructure.Repository.create(Domain.DemandeFinancement, fakeEventStore);

let DeleteDemandeFinancement = require('./delete')(Domain.DemandeFinancement, fakeRepository, fakePublisher, fakeLogger);

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
            user: Domain.UserId('test-user@example.js'),
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
          new Domain.UserId('me@example.fr'),
          {},
        ));
        DeleteDemandeFinancement = deleteDemandeFinancement(
          Domain.DemandeFinancement,
          fakeRepository,
          fakePublisher,
          fakeLogger,
        );
      });
      it('When deleter is different from author Then deletion is deny', async () => {
        try {
          const result = await DeleteDemandeFinancement({
            name: 'deleteDemandeFinancement',
            timestamp: Date.now(),
            user: new Domain.UserId('privileges-decision@example.com'),
            id: 'abcdef',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.equal(err.type, 'BusinessRuleError');
        }
      });
    });
  });
});
