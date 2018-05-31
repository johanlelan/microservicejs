const Domain = require('../../modules/domain');
const Infrastructure = require('../../modules/infrastructure');

const createDemandeFinancement = require('./create');
const addMontantDemande = require('./add-montant-demande');
const deleteDemandeFinancement = require('./delete');

exports.create = function create(eventStore, publisher, logger) {
  // retrieve repository
  const repository = Infrastructure.Repository.create(Domain.DemandeFinancement, eventStore);
  // every published demande-financement events should be sent to bus
  const commandHandler = {
    create: createDemandeFinancement(
      Domain.DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    addMontantDemande: addMontantDemande(
      Domain.DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
    delete: deleteDemandeFinancement(
      Domain.DemandeFinancement,
      repository,
      eventStore,
      publisher,
      logger,
    ),
  };

  return Promise.resolve(commandHandler);
};
