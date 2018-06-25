const DemandeFinancementCommands = require('./demande-financement/index');

module.exports = (repository, publisher, logger) =>
  DemandeFinancementCommands.create(repository, publisher, logger)
    .then(demandeFinancement => Promise.resolve({
      demandeFinancement,
    }));
