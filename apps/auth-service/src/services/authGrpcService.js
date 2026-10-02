const { pool } = require('../config/db');
const {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  grpc
} = require('@cab/shared-config');
const crypto = require('crypto');

/**
 * Đăng ký tài khoản (Register)
 * User(uid, username, password, role)
 */
async function register(call, callback) {
  try {
    const { username, password, role } = call.request;

    if (!username || !password) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Username and password are required'
      });
    }

    const assignedRole = (role && role.trim().toLowerCase() === 'admin') ? 'admin' : 'member';

    // Kiểm tra trùng username
    const existing = await pool.query('SELECT uid FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: `Username '${username}' already exists`
      });
    }

    // Mã hóa mật khẩu bằng Bcrypt
    const passwordHash = await hashPassword(password);
    const uid = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    await pool.query(
      'INSERT INTO users (uid, username, password, role) VALUES ($1, $2, $3, $4)',
      [uid, username, passwordHash, assignedRole]
    );

    return callback(null, {
      success: true,
      message: 'User registered successfully',
      uid,
      username,
      role: assignedRole,
      token: ''
    });
  } catch (error) {
    console.error('[AUTH_GRPC REGISTER ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * Đăng nhập tài khoản (Login) -> Cấp phát Token
 */
async function login(call, callback) {
  try {
    const { username, password } = call.request;

    if (!username || !password) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Username and password are required'
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'Invalid username or password'
      });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'Invalid username or password'
      });
    }

    // Cấp phát JWT Token chứa { uid, username, role }
    const token = signToken({
      uid: user.uid,
      username: user.username,
      role: user.role
    }, '2h');

    return callback(null, {
      success: true,
      message: 'Login successful',
      token,
      uid: user.uid,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('[AUTH_GRPC LOGIN ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * Đăng xuất (Logout) -> Vô hiệu hóa Token bằng Blacklist
 */
async function logout(call, callback) {
  try {
    const { token, uid } = call.request;

    if (!token) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Token is required for logout'
      });
    }

    // Đưa token vào blacklist
    await pool.query(
      'INSERT INTO token_blacklist (token, uid, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'2 hours\')',
      [token, uid || null]
    );

    return callback(null, {
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('[AUTH_GRPC LOGOUT ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * Xác thực token (ValidateToken)
 */
async function validateToken(call, callback) {
  try {
    const { token } = call.request;

    if (!token) {
      return callback(null, { valid: false, message: 'Missing token' });
    }

    // Kiểm tra token có nằm trong blacklist không
    const blacklisted = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1',
      [token]
    );

    if (blacklisted.rows.length > 0) {
      return callback(null, {
        valid: false,
        message: 'Token has been revoked/logged out'
      });
    }

    // Kiểm tra chữ ký và hạn dùng token
    const decoded = verifyToken(token);

    return callback(null, {
      valid: true,
      uid: decoded.uid || decoded.id,
      username: decoded.username || '',
      role: decoded.role || 'member',
      message: 'Token is valid'
    });
  } catch (error) {
    return callback(null, {
      valid: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  validateToken
};
