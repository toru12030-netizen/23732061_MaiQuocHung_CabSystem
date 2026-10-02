const { sendError } = require('@cab/shared-config');
const { authClient } = require('../grpc/grpcClients');

/**
 * Middleware xác thực JWT token
 * Kiểm tra chữ ký, hạn dùng và blacklist (qua AuthService gRPC ValidateToken)
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  // Xác thực token qua AuthService gRPC (bao gồm cả kiểm tra blacklist khi logout)
  authClient.ValidateToken({ token }, (err, response) => {
    if (err || !response || !response.valid) {
      const msg = response ? response.message : (err ? err.details || err.message : 'Invalid or expired token');
      return sendError(res, 401, 'INVALID_TOKEN', msg);
    }

    req.user = {
      uid: response.uid,
      id: response.uid,
      username: response.username,
      role: (response.role || 'member').toLowerCase()
    };
    req.token = token;

    req.headers['x-user-id'] = response.uid;
    req.headers['x-user-role'] = req.user.role;
    next();
  });
}

/**
 * Middleware phân quyền RBAC
 * Hỗ trợ phân cấp (Role Hierarchy): 'admin' luôn có quyền của 'member'
 * Nếu member gọi API admin -> HTTP 403 Forbidden
 */
function requireRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    }

    const userRole = req.user.role.toLowerCase();

    // Admin có toàn quyền truy cập
    if (userRole === 'admin') {
      return next();
    }

    // Kiểm tra xem role của user có nằm trong danh sách cho phép không
    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return sendError(
      res,
      403,
      'FORBIDDEN',
      `Access denied: Role '${req.user.role}' is not authorized to access this resource. Allowed: [${allowedRoles.join(', ')}]`
    );
  };
}

module.exports = {
  authenticateJWT,
  requireRoles
};
