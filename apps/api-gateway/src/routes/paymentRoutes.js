const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT } = require('../middlewares/auth');

const paymentProxy = createProxyHandler(config.services.payment);

// Lấy bảng giá (Public)
router.get(['/', '/pricing'], paymentProxy);

// STT 19 & STT 30: Checkout thanh toán online
router.post('/checkout', authenticateJWT, paymentProxy);

// STT 19: Webhook callback từ cổng thanh toán
router.post(['/callback', '/:id/callback'], paymentProxy);

// Lấy chi tiết thanh toán
router.get('/:id', authenticateJWT, paymentProxy);

module.exports = router;
