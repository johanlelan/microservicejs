const ErrorValidation = require('../ErrorValidation');
const DemandeFinancementId = require('../../domain/demande-financement-id');

const validate = (command) => {
  const errors = [];
  if (command.name !== 'deleteDemandeFinancement') {
    errors.push({
      message: 'Command name should be "deleteDemandeFinancement"',
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
module.exports = (DemandeFinancement, repository, eventStore, publisher, permissions, logger) =>
  async function deleteDemandeFinancement(command) {
  // validate inputs
    try {
      validate(command);
    } catch (err) {
      throw err;
    }

    // get current aggregate state
    let current;
    try {
      current = repository.getById(new DemandeFinancementId(command.id));
    } catch (err) {
      logger.info(`Aggregate ${command.id} does not exist anymore`);
      // do not throw an UnkownAggregate Error
      // idempodency implies to return a 204 event if aggregate does not exist
      // no more events to publish
      return [];
    }

    // invoking a function which is a part of the
    // aggregate defined in a domain model
    // authorize user
    permissions.canDeleteDemandeFinancement(command.user, current, command.data);
    logger.info(`Incoming user ${command.user.id} is allowed to execute ${command.name} with ${JSON.stringify(command.data)}`);
    const events = current.delete(command.user);
    events.forEach(event => publisher.publish(event));
    return events;
  };
