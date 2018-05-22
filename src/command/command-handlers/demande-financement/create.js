const ErrorValidation = require('../ErrorValidation');


// TODO JLL: use AJV to validate data field
const validate = (command) => {
  const errors = [];
  if (command.name !== 'createDemandeFinancement') {
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
  if (errors.length === 0) {
    return undefined;
  }
  throw new ErrorValidation('Command is invalid', { message: 'Command is invalid', errors });
};

module.exports = (DemandeFinancement, repository, eventStore, publisher, logger) =>
  async function CreateDemandeFinancement(command) {
  // validate inputs
    try {
      validate(command);
    } catch (err) {
      throw err;
    }

    // authorize user
    DemandeFinancement.canCreateDemandeFinancement(command.user, command.data);
    logger.info(`Incoming user "${command.user.id}" is allowed to execute ${command.name}`);

    // invoking a function which is a part of the
    // aggregate defined in a domain model
    const result = {};
    DemandeFinancement.create(command.user, command.data).forEach((event) => {
      result.aggregateId = event.aggregateId;
      publisher.publish(event);
    });
    return result;
  };
