const chai = require('chai');
const DemandeFinancementId = require('./demande-financement-id');

describe('Demande Financement Id', () => {
  it('Then Equals of Undefined Should be False', () => {
    const demandeFinancementId = new DemandeFinancementId('12345');
    chai.assert.isOk(!demandeFinancementId.equals(undefined));
  });
  it('Then Equals of same id Should be True', () => {
    const demandeFinancementId = new DemandeFinancementId('12345');
    const demandeFinancementId2 = new DemandeFinancementId('12345');
    chai.assert.isOk(demandeFinancementId.equals(demandeFinancementId2));
  });
});
