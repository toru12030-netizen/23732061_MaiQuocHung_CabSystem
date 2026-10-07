const { authClient, customerClient, mapGrpcErrorToHttp } = require('../grpc/grpcClients');
const { sendSuccess, sendError } = require('@cab/shared-config');

/**
 * REST Endpoint: POST /api/v1/auth/register
 * Chuyển đổi thành gRPC call: AuthService.Register
 */
function register(req, res) {
  const { username, password, role, fullname, age, address } = req.body;

  authClient.Register({ username, password, role }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }

    // Tự động khởi tạo hồ sơ Customer trong customer-service (MongoDB customer_db)
    const assignedRole = role || (response && response.role) || 'member';
    if (response && response.uid && assignedRole === 'member') {
      customerClient.CreateCustomer({
        uid: response.uid,
        fullname: fullname || username || '',
        age: Number(age) || 0,
        address: address || ''
      }, (custErr) => {
        if (custErr) {
          console.warn('[GATEWAY] Notice auto-creating customer in MongoDB:', custErr.message);
        }
      });
    }

    return sendSuccess(res, response, 201, 'User registered successfully');
  });
}

/**
 * REST Endpoint: POST /api/v1/auth/login
 * Chuyển đổi thành gRPC call: AuthService.Login
 */
function login(req, res) {
  const { username, password } = req.body;

  authClient.Login({ username, password }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, response, 200, 'Login successful');
  });
}

/**
 * REST Endpoint: POST /api/v1/auth/logout
 * Chuyển đổi thành gRPC call: AuthService.Logout
 */
function logout(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';

  if (!token) {
    return sendError(res, 400, 'BAD_REQUEST', 'Authorization token is required for logout');
  }

  const uid = req.user ? req.user.uid : '';

  authClient.Logout({ token, uid }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, response, 200, 'Logged out successfully');
  });
}

module.exports = {
  register,
  login,
  logout
};
