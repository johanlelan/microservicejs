const Domain = require('../../modules/domain');

const ErrorValidation = require('../ErrorValidation');

const validate = (command) => {
  const errors = [];
  if (command.name !== 'addMontantDemande') {
    errors.push({
      message: 'Command name should be "createDemandeFinancement"',
    });
  }
  if (!command.timestamp) {
    errors.push({
      message: 'Command should have a timestamp',
    });
  }
  if (!command.user) {
    errors.push({
      message: 'Command should have a user',
    });
  }
  if (!command.id) {
    errors.push({
      message: 'Command should have an identifier',
    });
  }
  if (errors.length === 0) {
    return;
  }
  throw new ErrorValidation('Command is invalid', { message: 'Command is invalid', errors });
};
module.exports = (DemandeFinancement, repository, publisher, logger) =>
  async function AddMontantDemande(command) {
  // validate inputs
    try {
      validate(command);
    } catch (err) {
      throw err;
    }

    // get current aggregate state
    let current;
    try {
      current = repository.getById(new Domain.DemandeFinancementId(command.id));
    } catch (err) {
      throw err;
    }

    // invoking a function which is a part of the
    // aggregate defined in a domain model
    // authorize user
    DemandeFinancement.canAddMontantDemande(command.user, current, command.data);
    logger.info(`Incoming user "${command.user.id}" is allowed to execute ${command.name} with ${JSON.stringify(command.data)}`);
    const events = current.ajouterMontantDemande(command.id, command.user, current, command.data);
    events.forEach(event => publisher.publish(event));
    return events;
  };
