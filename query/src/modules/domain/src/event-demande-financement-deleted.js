const infrastructure = require('../../infrastructure');

class DemandeFinancementDeleted {
  constructor(aggregateId, author) {
    this.name = this.constructor.name;
    this.id = infrastructure.idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
  }
}

module.exports = DemandeFinancementDeleted;
