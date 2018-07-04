const debug = require('debug')('microservice:command:handler:delete');

const Domain = require('../../modules/domain');

const ErrorValidation = require('../ErrorValidation');

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
module.exports = (DemandeFinancement, repository, publisher, logger) =>
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
      current = repository.getById(new Domain.DemandeFinancementId(command.id));
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
    return DemandeFinancement.canDeleteDemandeFinancement(command.user, current)
      .then((rulesEngineEvents) => {
      // look for error domain validation events raised
        const errorDomainValidationEvents = rulesEngineEvents
          .filter(event => event.type === 'BusinessRuleError')
          .map((event) => {
            const mapEvent = event.params;
            mapEvent.type = event.type;
            return mapEvent;
          });
        if (errorDomainValidationEvents.length > 0) {
          debug('Rule engine raised some business rules error events', errorDomainValidationEvents);
          // Only throw first error
          throw errorDomainValidationEvents[0];
        }
        logger.info(`Incoming user "${command.user.id}" is allowed to execute ${command.name}`);
        return current.delete(command.user)
          .then((events) => {
            // emit all events
            // -> rules engine events
            // -> domain events
            const allEvents = rulesEngineEvents.concat(events);
            allEvents.forEach((event) => {
              publisher.publish(event);
            });
            return allEvents;
          });
      });
  };
