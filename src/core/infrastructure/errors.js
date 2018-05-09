exports.PermissionDenied = detail => ({
  statusCode: 403,
  code: '403.1',
  message: 'Permission is denied',
  detail,
});
