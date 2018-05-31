const DemandeFinancementCommands = require('./demande-financement/index');

module.exports = (eventStore, publisher, logger, channel) =>
  DemandeFinancementCommands.create(eventStore, publisher, logger, channel)
    .then(demandeFinancement => Promise.resolve({
      demandeFinancement,
    }));
