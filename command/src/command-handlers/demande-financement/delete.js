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
    return Promise.resolve();
  }
  return Promise.reject(new ErrorValidation('Command is invalid', { message: 'Command is invalid', errors }));
};
module.exports = (DemandeFinancement, repository, publisher, logger) =>
  async function deleteDemandeFinancement(command) {
    // validate inputs
    return validate(command).then(() =>
    // get current aggregate state
      repository.getById(new Domain.DemandeFinancementId(command.id))
        .then(current =>
          // invoking a function which is a part of the
          // aggregate defined in a domain model
          // authorize user
          DemandeFinancement.canDeleteDemandeFinancement(command.user, current)
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
                return Promise.reject(errorDomainValidationEvents[0]);
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
            })));
  };
