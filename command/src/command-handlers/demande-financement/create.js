const debug = require('debug')('microservice:command:handler:create');

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

module.exports = (DemandeFinancement, publisher, logger) =>
  async function CreateDemandeFinancement(command) {
  // validate inputs
    try {
      validate(command);
    } catch (err) {
      throw err;
    }

    // authorize user
    return DemandeFinancement.canCreateDemandeFinancement(command.user, command.data)
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
        // invoking a function which is a part of the
        // aggregate defined in a domain model
        return DemandeFinancement.create(command.user, command.data)
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
