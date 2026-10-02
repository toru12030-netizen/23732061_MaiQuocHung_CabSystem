const axios = require('axios');
const { sendError } = require('@cab/shared-config');

/**
 * Proxy request tới microservice mục tiêu
 * @param {string} targetBaseUrl - URL gốc của service (vd: http://auth-service:3001)
 * @param {string} [pathPrefix=''] - Tiền tố đường dẫn nếu cần thay đổi
 */
function createProxyHandler(targetBaseUrl, pathPrefix = '') {
  return async (req, res) => {
    try {
      // Chuẩn hóa đường dẫn gửi tới service
      const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

      // Sao chép headers cần thiết, loại bỏ host header để tránh xung đột
      const headers = { ...req.headers };
      delete headers.host;
      delete headers['content-length'];

      // Inject authenticated user info if present
      if (req.user) {
        headers['x-user-id'] = req.user.uid;
        headers['x-user-role'] = req.user.role;
        headers['x-username'] = req.user.username;
      }

      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers,
        params: req.query,
        data: req.body,
        validateStatus: () => true, // Không throw lỗi khi nhận 4xx, 5xx để trả nguyên trạng về client
        timeout: 10000
      });

      // Forward response headers quan trọng
      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      }

      return res.status(response.status).json(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return sendError(
          res,
          503,
          'SERVICE_UNAVAILABLE',
          `Downstream service unavailable: ${targetBaseUrl}`
        );
      }
      return sendError(
        res,
        500,
        'GATEWAY_ERROR',
        `Gateway proxy forwarding failed: ${error.message}`
      );
    }
  };
}

module.exports = {
  createProxyHandler
};
