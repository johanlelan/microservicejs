const decisionProjection = require('./utils/decision-projection');
// events
const DemandeFinancementCreated = require('./event-demande-financement-created');
const MontantDemandeAdded = require('./event-montant-demande-added');
const DemandeFinancementDeleted = require('./event-demande-financement-deleted');

const DemandeFinancement = function DemandeFinancement(events) {
  const self = this;

  decisionProjection.create()
    .register(DemandeFinancementCreated, (event) => {
      self.aggregateId = event.aggregateId;
      self.author = event.author;
      Object.keys(event.content).forEach((key) => {
        // should not manage properties
        // aggregateId, author
        self[key] = event.content[key];
      });
    })
    .register(MontantDemandeAdded, (event) => {
      self.author = event.author;
      self.montant = event.montant;
      self.isUpdated = true;
    })
    .register(DemandeFinancementDeleted, (event) => {
      self.author = event.author;
      self.isDeleted = true;
    })
    .apply(events);

  self.delete = function remove(deleter) {
    if (!self.isDeleted) {
      return [
        new DemandeFinancementDeleted(self.aggregateId, deleter),
      ];
    }
    return [];
  };

  self.ajouterMontantDemande = function ajouterMontantDemande(id, author, current, montant) {
    return [
      new MontantDemandeAdded(self.aggregateId, author, montant),
    ];
  };
};

exports.createFromEvents = function createFromEvents(events) {
  return new DemandeFinancement(events);
};
