const infrastructure = require('../../infrastructure');

class DemandeFinancementCreated {
  constructor(aggregateId, author, content) {
    this.type = this.constructor.name;
    this.id = infrastructure.idGenerator.generate();
    this.aggregateId = aggregateId;
    this.author = author;
    this.timestamp = Date.now();
    this.content = content;
  }
}

module.exports = DemandeFinancementCreated;
