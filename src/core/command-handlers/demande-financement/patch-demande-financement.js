const isArray = require('lodash.isarray');

const ErrorValidation = require('../ErrorValidation');
const DemandeFinancementId = require('../../domain/demande-financement-id');

const validate = (command) => {
  const errors = [];
  if (command.name !== 'patchDemandeFinancement') {
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
  if (!isArray(command.data)) {
    errors.push({
      message: 'Command data should be an array',
    });
  }
  if (errors.length === 0) {
    return;
  }
  throw new ErrorValidation('Command is invalid', { message: 'Command is invalid', errors });
};
module.exports = (DemandeFinancement, repository, eventStore, publisher, permissions, logger) =>
  async function PatchDemandeFinancement(command) {
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
      throw err;
    }

    // TODO JLL authorize user to globally patch aggregate
    // permissions.canPatchDemandeFinancement(command.user, current, command.data);

    // invoking a function which is a part of the
    // aggregate defined in a domain model
    const patches = command.data;
    // invoke domain model for each op/patch by order
    const promises = patches.map(patch =>
      new Promise((resolve, reject) => {
        try {
        // authorize user
          permissions.canPatchDemandeFinancement(command.user, current, patch);
        } catch (err) {
          return reject(err);
        }
        logger.info(`Incoming user ${command.user.id} is allowed to execute ${command.name} with ${JSON.stringify(patch)}`);
        return resolve(DemandeFinancement.patch(
          publisher.publish,
          command.id,
          command.user,
          patch,
        ));
      }));
    // TODO JLL: should reject at first error (.all invoke all promise even if one failed)
    return Promise.all(promises).then(() => current.demandeFinancementId);
  };
