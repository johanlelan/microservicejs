const DemandeFinancementCommands = require('./demande-financement/index');

module.exports = (eventStore, publisher, logger) =>
  DemandeFinancementCommands.create(eventStore, publisher, logger)
    .then(demandeFinancement => Promise.resolve({
      demandeFinancement,
    }));
