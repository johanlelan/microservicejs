const idGenerator = require('./utils/idGenerator');
const decisionProjection = require('./utils/decision-projection');

// id
const DemandeFinancementId = require('./demande-financement-id');
// events
const DemandeFinancementCreated = require('./events/demande-financement-created');
const DemandeFinancementUpdated = require('./events/demande-financement-updated');
const DemandeFinancementDeleted = require('./events/demande-financement-deleted');

exports.create = function create(publishEvent, author, content) {
  const demandeFinancementId = new DemandeFinancementId(idGenerator.generate());
  publishEvent(new DemandeFinancementCreated(demandeFinancementId, author, content));
  return demandeFinancementId;
};

exports.patch = function patch(publishEvent, id, author, opPatch) {
  const demandeFinancementId = new DemandeFinancementId(id);
  publishEvent(new DemandeFinancementUpdated(demandeFinancementId, author, opPatch));
  return demandeFinancementId;
};

const DemandeFinancement = function DemandeFinancement(events) {
  const self = this;

  decisionProjection.create()
    .register(DemandeFinancementCreated, (event) => {
      this.demandeFinancementId = event.aggregateId;
      this.author = event.author;
    })
    .register(DemandeFinancementUpdated, (event) => {
      this.author = event.author;
      this.patch = event.patch;
      this.isUpdated = true;
    })
    .register(DemandeFinancementDeleted, (event) => {
      this.author = event.author;
      this.isDeleted = true;
    })
    .apply(events);

  self.delete = function remove(publishEvent, deleter) {
    if (self.isDeleted) {
      // already deleted for idempotency
      return;
    }
    publishEvent(new DemandeFinancementDeleted(self.demandeFinancementId, deleter));
  };
};

exports.createFromEvents = function createFromEvents(events) {
  return new DemandeFinancement(events);
};
