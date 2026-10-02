const { sendError } = require('@cab/shared-config');

function validateLogInput(req, res, next) {
  const { action, resource } = req.body;
  if (!action || !resource) {
    return sendError(res, 400, 'INVALID_INPUT', 'action and resource are required fields');
  }
  next();
}

function validateSecurityEvent(req, res, next) {
  const { eventType, details } = req.body;
  if (!eventType) {
    return sendError(res, 400, 'INVALID_INPUT', 'eventType is required');
  }
  next();
}

module.exports = {
  validateLogInput,
  validateSecurityEvent
};
