const infrastructure = require('../../infrastructure');

class UserRegistered {
  constructor(aggregateId, content) {
    this.type = this.constructor.name;
    this.id = infrastructure.idGenerator.generate();
    this.aggregateId = aggregateId;
    this.timestamp = Date.now();
    this.content = content;
  }
}

module.exports = UserRegistered;
