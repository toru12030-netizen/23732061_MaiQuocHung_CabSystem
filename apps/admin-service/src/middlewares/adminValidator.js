const { sendError } = require('@cab/shared-config');

function validateAuditLogQuery(req, res, next) {
  const { limit } = req.query;
  if (limit && (isNaN(parseInt(limit, 10)) || parseInt(limit, 10) < 1)) {
    return sendError(res, 400, 'INVALID_LIMIT', 'Limit must be a positive integer');
  }
  next();
}

module.exports = {
  validateAuditLogQuery
};
