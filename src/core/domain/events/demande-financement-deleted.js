const idGenerator = require('../utils/idGenerator');

class DemandeFinancementDeleted {
  constructor(aggregateId, author) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    Object.freeze(this);
  }
}

module.exports = DemandeFinancementDeleted;
