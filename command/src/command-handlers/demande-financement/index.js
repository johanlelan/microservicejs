const Domain = require('../../modules/domain');

const createDemandeFinancement = require('./create');
const addMontantDemande = require('./add-montant-demande');
const deleteDemandeFinancement = require('./delete');

exports.create = function create(repository, publisher, logger) {
  // every published demande-financement events should be sent to bus
  const commandHandler = {
    create: createDemandeFinancement(
      Domain.DemandeFinancement,
      publisher,
      logger,
    ),
    addMontantDemande: addMontantDemande(
      Domain.DemandeFinancement,
      repository,
      publisher,
      logger,
    ),
    delete: deleteDemandeFinancement(
      Domain.DemandeFinancement,
      repository,
      publisher,
      logger,
    ),
  };

  return Promise.resolve(commandHandler);
};
