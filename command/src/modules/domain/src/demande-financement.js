/* eslint no-underscore-dangle: ["error", { "allow": ["_active", "_updated", "_deleted"] }] */

// An aggregate + a command should return a array of events
// const get = require('lodash.get');

const infrastructure = require('../../infrastructure');

// id
const DemandeFinancementId = require('./demande-financement-id');
// events
const DemandeFinancementCreated = require('./event-demande-financement-created');
const MontantDemandeAdded = require('./event-montant-demande-added');
const DemandeFinancementDeleted = require('./event-demande-financement-deleted');
// rule engine
const EngineManager = require('./demande-financement-rules');
// business rules
const rules = require('./business-rules.json');

const engine = EngineManager.create(rules);

exports.create = function create(author, content) {
  return Promise.resolve([
    new DemandeFinancementCreated(
      new DemandeFinancementId(infrastructure.idGenerator.generate()),
      author,
      content,
    ),
  ]);
};

const DemandeFinancement = function DemandeFinancement(events, initState) {
  const hydrateProcessor = infrastructure.HydrateProcessor.create();
  const self = this;
  if (initState) {
    Object.keys(initState).forEach((key) => {
      // should not manage properties
      // aggregateId, author
      self[key] = initState[key];
    });
  }

  hydrateProcessor.register(DemandeFinancementCreated, (event) => {
    self.aggregateId = event.aggregateId;
    self.author = event.author;
    self._active = true;
    self._created = event.timestamp;
    Object.keys(event.content).forEach((key) => {
      // should not manage properties
      // aggregateId, author
      self[key] = event.content[key];
    });
  }).register(MontantDemandeAdded, (event) => {
    self.author = event.author;
    self.montant = event.montant;
    self._updated = event.timestamp;
  }).register(DemandeFinancementDeleted, (event) => {
    self.author = event.author;
    self._active = false;
    self._deleted = event.timestamp;
  }).apply(events);

  self.delete = function remove(deleter) {
    // if aggregate is active then delete it
    if (self._active) {
      return Promise.resolve([
        new DemandeFinancementDeleted(self.aggregateId, deleter),
      ]);
    }
    return Promise.resolve([]);
  };

  self.ajouterMontantDemande = function ajouterMontantDemande(author, montant) {
    return Promise.resolve([
      new MontantDemandeAdded(self.aggregateId, author, montant),
    ]);
  };

  self.apply = function apply(event) {
    hydrateProcessor.apply(event);
  };
};

exports.createFromEvents = function createFromEvents(events) {
  return new DemandeFinancement(events);
};

exports.wrap = function wrap(state) {
  return new DemandeFinancement([], state);
};

exports.canCreateDemandeFinancement = (user, demandeFinancement) =>
  // creation should only allow REQUESTED and SUPPORTED status
  engine.run({
    createDemandeFinancement: {
      user,
      demandeFinancement,
    },
  });
exports.canAddMontantDemande = (user, demandeFinancement, montantDemande) =>
  // Do not allow negative montantDemande
  engine
    .run({
      addMontantDemande: {
        user,
        demandeFinancement,
        montantDemande,
      },
    });
exports.canDeleteDemandeFinancement = (deleter, demandeFinancement) =>
  // Deletion, only creator can delete its demande-financement
  engine
    .run({
      deleteDemandeFinancement: {
        user: deleter,
        demandeFinancement,
      },
    });

