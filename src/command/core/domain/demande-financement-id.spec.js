const chai = require('chai');
const DemandeFinancementId = require('./demande-financement-id');

it('Then Equals of Undefined Should be False', () => {
  const demandeFinancementId = new DemandeFinancementId('12345');
  chai.assert.isOk(!demandeFinancementId.equals(undefined));
});