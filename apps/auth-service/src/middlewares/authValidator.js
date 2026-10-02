const { sendError } = require('@cab/shared-config');

function validateRegister(req, res, next) {
  const { username, password, role } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return sendError(res, 400, 'INVALID_USERNAME', 'Username must be at least 3 characters');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return sendError(res, 400, 'INVALID_PASSWORD', 'Password must be at least 6 characters');
  }
  if (role && !['member', 'admin'].includes(role)) {
    return sendError(res, 400, 'INVALID_ROLE', 'Role must be either member or admin');
  }
  next();
}

function validateLogin(req, res, next) {
  const { username, password } = req.body;
  if (!username || !password) {
    return sendError(res, 400, 'MISSING_CREDENTIALS', 'Username and password are required');
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin
};
