const { pool } = require('../config/db');
const {
  sendSuccess,
  sendError,
  hashPassword,
  comparePassword,
  signToken,
  sanitizeInput,
  ROLES
} = require('@cab/shared-config');
const crypto = require('crypto');

/**
 * Tiêu chí 9: Đăng ký tài khoản khách hàng
 * POST /auth/register/customer
 */
async function registerCustomer(req, res) {
  try {
    const sanitized = sanitizeInput(req.body);
    const { fullName, email, phone, password } = sanitized;

    if (!fullName || !email || !phone || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'All fields (fullName, email, phone, password) are required');
    }

    // Email validation cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'INVALID_EMAIL', 'Email format is invalid');
    }

    // Tiêu chí 25: Parameterized Query kiểm tra trùng email / phone (chống SQL Injection)
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existing.rows.length > 0) {
      return sendError(res, 409, 'USER_EXISTS', 'User with this email or phone number already exists');
    }

    // Tiêu chí 24: Data encryption at rest - Mật khẩu được mã hóa Bcrypt trước khi ghi vào DB
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Parameterized Query INSERT an toàn
    const insertQuery = `
      INSERT INTO users (id, full_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name, email, phone, role, created_at
    `;
    const result = await pool.query(insertQuery, [
      userId,
      fullName,
      email,
      phone,
      passwordHash,
      ROLES.CUSTOMER
    ]);

    const createdUser = result.rows[0];

    return sendSuccess(
      res,
      {
        id: createdUser.id,
        fullName: createdUser.full_name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        createdAt: createdUser.created_at
      },
      201,
      'Customer account created successfully'
    );
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}

/**
 * Tiêu chí 10: Đăng nhập khách hàng
 * POST /auth/login
 * Tiêu chí 25: SQL Injection Attempt -> Không bị bypass, query an toàn
 */
async function login(req, res) {
  try {
    const sanitized = sanitizeInput(req.body);
    const { identifier, password } = sanitized;

    if (!identifier || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Identifier and password are required');
    }

    // Tiêu chí 25: Parameterized query tuyệt đối an toàn với SQL Injection
    // Chuỗi injection "' OR 1=1 --" được truyền an toàn dưới dạng giá trị string literal của tham số $1
    const query = 'SELECT * FROM users WHERE email = $1 OR phone = $1';
    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
    }

    const user = result.rows[0];

    // So khớp mật khẩu với mã hash bcrypt trong DB
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
    }

    // Cấp phát JWT Access Token
    const tokenPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone
    };
    const accessToken = signToken(tokenPayload, '15m');
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Lưu refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url
        }
      },
      200,
      'Login successful'
    );
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}

/**
 * Tiêu chí 11: Lấy thông tin khách hàng với mã số
 * GET /customers/:id hoặc GET /auth/profile
 */
async function getCustomerById(req, res) {
  try {
    const customerId = req.params.id || (req.user && req.user.id);

    if (!customerId) {
      return sendError(res, 400, 'MISSING_PARAM', 'Customer ID is required');
    }

    const query = 'SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [customerId]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Customer not found');
    }

    const customer = result.rows[0];
    return sendSuccess(res, {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      avatarUrl: customer.avatar_url,
      createdAt: customer.created_at
    }, 200, 'Customer details retrieved');
  } catch (error) {
    console.error('[GET CUSTOMER ERROR]:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}

/**
 * Yêu cầu gửi OTP cho tài xế (Tiêu chí 21)
 * POST /auth/driver-otp/request
 */
async function requestDriverOtp(req, res) {
  try {
    const { phone } = sanitizeInput(req.body);
    if (!phone) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Phone number is required');
    }

    const otpCode = '123456'; // Giả lập OTP cố định cho môi trường demo/testing
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await pool.query(
      `INSERT INTO driver_otp (phone, otp_code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET otp_code = $2, expires_at = $3`,
      [phone, otpCode, expiresAt]
    );

    return sendSuccess(res, {
      phone,
      message: 'OTP has been sent to phone number',
      // Trong môi trường testing/development, hỗ trợ hiển thị để chạy postman tự động
      testOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    }, 200, 'OTP sent successfully');
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}

/**
 * Xác thực OTP tài xế (Tiêu chí 21)
 * POST /auth/driver-otp/verify
 */
async function verifyDriverOtp(req, res) {
  try {
    const { phone, otp } = sanitizeInput(req.body);
    if (!phone || !otp) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Phone and OTP are required');
    }

    const result = await pool.query(
      'SELECT * FROM driver_otp WHERE phone = $1 AND otp_code = $2 AND expires_at > NOW()',
      [phone, otp]
    );

    if (result.rows.length === 0) {
      return sendError(res, 400, 'INVALID_OTP', 'Invalid or expired OTP code');
    }

    const verificationToken = `proof_${crypto.randomBytes(32).toString('hex')}`;
    await pool.query(
      'UPDATE driver_otp SET verification_token = $1 WHERE phone = $2',
      [verificationToken, phone]
    );

    return sendSuccess(res, {
      phone,
      verified: true,
      verificationToken
    }, 200, 'OTP verified successfully');
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
}

module.exports = {
  registerCustomer,
  login,
  getCustomerById,
  requestDriverOtp,
  verifyDriverOtp
};
