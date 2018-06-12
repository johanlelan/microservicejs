const infrastructure = require('../../infrastructure');

class DemandeFinancementDeleted {
  constructor(aggregateId, author) {
    this.type = this.constructor.name;
    this.id = infrastructure.idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
  }
}

module.exports = DemandeFinancementDeleted;
