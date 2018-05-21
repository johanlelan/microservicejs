const idGenerator = require('../infrastructure/idGenerator');

class DemandeFinancementCreated {
  constructor(aggregateId, author, content) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    this.content = content;
    Object.freeze(this);
  }
}

module.exports = DemandeFinancementCreated;
