class DemandeFinancementId {
  constructor(id) {
    this.id = id;
  }

  equals(other) {
    if (!other) {
      return false;
    }
    return this.id === other.id;
  }

  toString() {
    return `demandeFinancement:${this.id}`;
  }
}

module.exports = DemandeFinancementId;
