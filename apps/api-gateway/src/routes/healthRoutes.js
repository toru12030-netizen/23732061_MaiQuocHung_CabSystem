const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../config');
const { sendSuccess } = require('@cab/shared-config');

/**
 * Tiêu chí 6: GET /health
 * Trả về trạng thái hoạt động của Gateway
 */
router.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    gateway: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  }, 200, 'Gateway is healthy');
});

/**
 * Tiêu chí 6: GET /ready
 * Kiểm tra Gateway đã sẵn sàng tiếp nhận traffic
 */
router.get('/ready', (req, res) => {
  return sendSuccess(res, {
    status: 'ready',
    gateway: 'READY',
    timestamp: new Date().toISOString()
  }, 200, 'Gateway is ready to serve requests');
});

/**
 * Tiêu chí 6: GET /health/services
 * Kiểm tra trạng thái toàn bộ các microservices và hạ tầng phía sau
 */
router.get('/health/services', async (req, res) => {
  const serviceChecks = Object.entries(config.services).map(async ([name, url]) => {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      return {
        service: name,
        status: response.status === 200 ? 'UP' : 'DEGRADED',
        details: response.data
      };
    } catch (error) {
      return {
        service: name,
        status: 'DOWN',
        error: error.message
      };
    }
  });

  const results = await Promise.all(serviceChecks);

  const servicesStatus = {};
  let overallHealthy = true;

  results.forEach(item => {
    servicesStatus[item.service] = item.status;
    if (item.status === 'DOWN') {
      overallHealthy = false;
    }
  });

  return sendSuccess(res, {
    gateway: 'UP',
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: servicesStatus,
    results
  }, 200, 'Microservices health check summary');
});

module.exports = router;
