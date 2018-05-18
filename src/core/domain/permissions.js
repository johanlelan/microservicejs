const ErrorPermissions = require('./ErrorPermissions');

exports.canCreateDemandeFinancement = (user, content) => {
  // On creation should only allow REQUESTED and SUPPORTED status
  if (content && [undefined, 'REQUESTED', 'SUPPORTED'].indexOf(content.status) === -1) {
    throw new ErrorPermissions('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
  }
};

exports.canAddMontantDemande = (user, current, montantDemande) => {
  // Do not allow negative montantDemande
  if (montantDemande.ttc < 0) {
    throw new ErrorPermissions('Could not set a negative "MontantDemande"');
  }
};

exports.canDeleteDemandeFinancement = () => {
  // No specific permissions to delete
};
