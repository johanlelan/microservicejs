const idGenerator = require('./utils/idGenerator');

class DemandeFinancementUpdated {
  constructor(aggregateId, author, patch) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    this.patch = patch;
  }
}

module.exports = DemandeFinancementUpdated;
