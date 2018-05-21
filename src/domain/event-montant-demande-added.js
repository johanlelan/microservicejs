const idGenerator = require('../infrastructure/idGenerator');

class MontantDemandeAdded {
  constructor(aggregateId, author, montant) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    this.montant = montant;
  }
}

module.exports = MontantDemandeAdded;
