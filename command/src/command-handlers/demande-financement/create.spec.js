const Domain = require('../../modules/domain');

const CreateDemandeFinancementCommand = require('./create')(Domain.DemandeFinancement);
const chai = require('chai');

describe('Commands', () => {
  describe('Create DemandeFinancement', () => {
    describe('Validation', () => {
      it('When command have no name Then return an error', async () => {
        try {
          const result = await CreateDemandeFinancementCommand({});
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no timestamp Then return an error', async () => {
        try {
          const result = await CreateDemandeFinancementCommand({
            name: 'createDemandeFinancement',
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
      it('When command have no user Then return an error', async () => {
        try {
          const result = await CreateDemandeFinancementCommand({
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
    });
    describe('Permissions', () => {
      it('When content status is not allowed Then return an error', async () => {
        try {
          const result = await CreateDemandeFinancementCommand({
            name: 'createDemandeFinancement',
            timestamp: Date.now(),
            user: {
              id: 'privileges-decision@example.com',
            },
            data: {
              status: 'REGISTERED',
            },
          });
          chai.assert.fail(result);
        } catch (err) {
          chai.assert.isOk(true);
        }
      });
    });
  });
});
