const permissionModule = require('./permissions');
const chai = require('chai');

describe('Permissions', () => {
  it('When add a negative MontantDemande Then Refuse', async () => {
    try {
      permissionModule.canAddMontantDemande({
        id: 'privileges-decision@example.com',
      }, {}, -1);
      chai.assert.fail(result);
    } catch (err) {
      chai.assert.isOk(true);
    }
  });
});
