const infrastructure = require('../../infrastructure');

class MontantDemandeAdded {
  constructor(aggregateId, author, montant) {
    this.name = this.constructor.name;
    this.id = infrastructure.idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    this.montant = montant;
  }
}

module.exports = MontantDemandeAdded;
