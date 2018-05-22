const DemandeFinancement = require('../../../domain/demande-financement');
const createDemandeFinancement = require('./create');
const addMontantDemande = require('./add-montant-demande');
const deleteDemandeFinancement = require('./delete');

const demandeFinancementRepository = require('../../repositories/repository');

exports.create = function create(eventStore, publisher, logger) {
  // retrieve repository
  const repository = demandeFinancementRepository.create(DemandeFinancement, eventStore);
  // every published demande-financement events should be sent to bus
  const commandHandler = {
    create: createDemandeFinancement(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    addMontantDemande: addMontantDemande(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    delete: deleteDemandeFinancement(
      DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
  };

  return Promise.resolve(commandHandler);
};
