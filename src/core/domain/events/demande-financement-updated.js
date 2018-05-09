const idGenerator = require('../utils/idGenerator');

class DemandeFinancementUpdated {
  constructor(aggregateId, author, patch) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.patch = patch;
    this.timestamp = Date.now();
    Object.freeze(this);
  }
}

module.exports = DemandeFinancementUpdated;
