const idGenerator = require('../infrastructure/idGenerator');

class DemandeFinancementDeleted {
  constructor(aggregateId, author) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
  }
}

module.exports = DemandeFinancementDeleted;
