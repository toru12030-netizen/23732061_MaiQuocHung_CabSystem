const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter tổng quát cho toàn bộ Gateway
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tối đa 1000 request trên mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  }
});

/**
 * Rate Limiter cho các API nhạy cảm / đặt xe (Booking)
 * Dùng để kiểm thử Tiêu chí 29: Rate limit attack -> trả về HTTP 429 Too Many Requests
 */
const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 giây
  max: 10, // Tối đa 10 request / 15 giây cho endpoint nhạy cảm (STT 29)
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded: Too many requests, please slow down'
    }
  }
});

module.exports = {
  globalRateLimiter,
  sensitiveRateLimiter
};
