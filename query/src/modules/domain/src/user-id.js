const ErrorDomainValidation = require('./ErrorDomainValidation');

class UserId {
  constructor(id) {
    if (!id) {
      throw new ErrorDomainValidation();
    }
    this.id = id;
    Object.freeze(this);
  }

  equals(other) {
    if (!other) {
      return false;
    }
    return this.id === other.id;
  }

  toString() {
    return `userId:${this.id}`;
  }
}

module.exports = UserId;
