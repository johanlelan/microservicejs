const permissionModule = require('./permissions');
const chai = require('chai');

describe('Permissions', () => {
  it('When Patch a read-only-property Then Refuse', async () => {
    try {
      permissionModule.canPatchDemandeFinancement({
        id: 'privileges-decision@example.com',
      }, {}, { op: 'add', path: '/readOnlyProperty', value: 'a value' });
      chai.assert.fail(result);
    } catch (err) {
      chai.assert.isOk(true);
    }
  });
});
