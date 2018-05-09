const ErrorPermissions = require('./ErrorPermissions');

exports.canCreateDemandeFinancement = (user, content) => {
  if (content && [undefined, 'REQUESTED', 'SUPPORTED'].indexOf(content.status) === -1) {
    throw new ErrorPermissions('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
  }
};

exports.canPatchDemandeFinancement = (user, current, patch) => {
  // TODO JLL: nothing implemented here
  if (patch.path === '/readOnlyProperty') {
    throw new ErrorPermissions('Could not patch Demande Financement on read-only-properties');
  }
};
