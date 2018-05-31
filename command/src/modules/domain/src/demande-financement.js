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
// errors
const ErrorPermissions = require('./ErrorPermissions');
const ErrorDomainValidation = require('./ErrorDomainValidation');

exports.create = function create(author, content) {
  return [
    new DemandeFinancementCreated(
      new DemandeFinancementId(infrastructure.idGenerator.generate()),
      author,
      content,
    ),
  ];
};

exports.canCreateDemandeFinancement = (user, content) => {
  // On creation should only allow REQUESTED and SUPPORTED status
  if (content && [undefined, 'REQUESTED', 'SUPPORTED'].indexOf(content.status) === -1) {
    throw new ErrorDomainValidation('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
  }
};

exports.canAddMontantDemande = (user, current, montantDemande) => {
  // Do not allow negative montantDemande
  if (montantDemande.ttc < 0) {
    throw new ErrorDomainValidation('Could not set a negative "MontantDemande"');
  }
};

exports.canDeleteDemandeFinancement = (user, current) => {
  // Only creator can delete its demandeFinancement
  // TODO JLL: use lodash get
  if (current.author.id !== user.id) {
    throw new ErrorPermissions('Only creator can delete its demandeFinancement');
  }
};

const DemandeFinancement = function DemandeFinancement(events) {
  const self = this;

  infrastructure.HydrateProcessor.create()
    .register(DemandeFinancementCreated, (event) => {
      self.aggregateId = event.aggregateId;
      self.author = event.author;
      self._active = true;
      Object.keys(event.content).forEach((key) => {
        // should not manage properties
        // aggregateId, author
        self[key] = event.content[key];
      });
    })
    .register(MontantDemandeAdded, (event) => {
      self.author = event.author;
      self.montant = event.montant;
      self._updated = event.timestamp;
    })
    .register(DemandeFinancementDeleted, (event) => {
      self.author = event.author;
      self._active = false;
      self._deleted = event.timestamp;
    })
    .apply(events);

  self.delete = function remove(deleter) {
    // if aggregate is active then delete it
    if (self._active) {
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
