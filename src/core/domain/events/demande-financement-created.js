const idGenerator = require('../utils/idGenerator');

class DemandeFinancementCreated {
  constructor(aggregateId, author, content) {
    this.id = idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.content = content;
    this.timestamp = Date.now();
    Object.freeze(this);
  }
}

module.exports = DemandeFinancementCreated;
