const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Roles
const ROLES = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  ADMIN: 'admin',
  MEMBER: 'member',
  admin: 'admin',
  member: 'member'
};

const { loadProto, grpc } = require('./grpcLoader');

// Ride Lifecycle Statuses
const RIDE_STATUS = {
  REQUESTED: 'requested',
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVED: 'driver_arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

// Driver Availability Statuses
const DRIVER_STATUS = {
  OFFLINE: 'offline',
  AVAILABLE: 'available',
  BUSY: 'busy',
  SUSPENDED: 'suspended'
};

// Driver Approval Statuses
const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Response Helpers matching OpenAPI Specification
function sendSuccess(res, arg2, arg3 = 200, arg4 = 'Success') {
  let statusCode = 200;
  let message = 'Success';
  let data = null;

  if (typeof arg2 === 'number') {
    // Called as: sendSuccess(res, statusCode, message, data)
    statusCode = arg2;
    message = typeof arg3 === 'string' ? arg3 : 'Success';
    data = (arg4 !== 'Success' && arg4 !== undefined) ? arg4 : (typeof arg3 === 'object' ? arg3 : null);
  } else {
    // Called as: sendSuccess(res, data, statusCode, message)
    data = arg2;
    if (typeof arg3 === 'number') statusCode = arg3;
    if (typeof arg4 === 'string') message = arg4;
  }

  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function sendError(res, statusCode, code, message, details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };
  if (details) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
}

// JWT Helpers
const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_bytes_cab_system_2026';

function signToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, DEFAULT_JWT_SECRET, {
    expiresIn,
    issuer: process.env.JWT_ISSUER || 'cab-system-local',
    audience: process.env.JWT_AUDIENCE || 'cab-system-local-clients'
  });
}

function verifyToken(token) {
  return jwt.verify(token, DEFAULT_JWT_SECRET, {
    issuer: process.env.JWT_ISSUER || 'cab-system-local',
    audience: process.env.JWT_AUDIENCE || 'cab-system-local-clients'
  });
}

// Password Hashing (Data encryption at rest / Bcrypt)
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Security: XSS Sanitization (Escapes HTML characters)
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  if (data !== null && typeof data === 'object') {
    const sanitized = {};
    for (const key of Object.keys(data)) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  return data;
}

// Correlation ID & Logger Helper
function formatLog(serviceName, level, message, meta = {}) {
  const logObj = {
    timestamp: new Date().toISOString(),
    service: serviceName,
    level,
    message,
    ...meta
  };
  return JSON.stringify(logObj);
}

module.exports = {
  ROLES,
  RIDE_STATUS,
  DRIVER_STATUS,
  APPROVAL_STATUS,
  sendSuccess,
  sendError,
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  sanitizeInput,
  formatLog,
  loadProto,
  grpc
};
