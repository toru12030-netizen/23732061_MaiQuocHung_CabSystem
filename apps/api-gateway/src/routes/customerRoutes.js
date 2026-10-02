const express = require('express');
const router = express.Router();
const customerGrpcController = require('../controllers/customerGrpcController');
const { authenticateJWT, requireRoles } = require('../middlewares/auth');
const { sensitiveRateLimiter } = require('../middlewares/rateLimiter');

const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const bookingProxy = createProxyHandler(config.services.booking);

// GET /customers/:customerId/bookings (STT 14: Lấy danh sách booking của khách hàng)
router.get('/:customerId/bookings', authenticateJWT, bookingProxy);

// GET /customers (Read all: role member / admin)
router.get('/', authenticateJWT, requireRoles('member', 'admin'), customerGrpcController.listCustomers);

// GET /customers/:uid (Read single: role member / admin)
router.get('/:uid', authenticateJWT, requireRoles('member', 'admin'), customerGrpcController.getCustomer);

// POST /customers (Create: role admin)
router.post('/', sensitiveRateLimiter, authenticateJWT, requireRoles('admin'), customerGrpcController.createCustomer);

// PUT /customers/:uid (Update: role admin)
router.put('/:uid', authenticateJWT, requireRoles('admin'), customerGrpcController.updateCustomer);

// DELETE /customers/:uid (Delete: role admin)
router.delete('/:uid', authenticateJWT, requireRoles('admin'), customerGrpcController.deleteCustomer);

module.exports = router;
