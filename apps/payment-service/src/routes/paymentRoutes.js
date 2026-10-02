const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateCheckout, validateCallback } = require('../middlewares/paymentValidator');

// Lấy bảng giá xe
router.get(['/pricing', '/payments/pricing'], paymentController.getPricing);

// STT 19 & STT 30: Checkout thanh toán online (với validation)
router.post(['/payments/checkout', '/checkout'], validateCheckout, paymentController.checkout);

// STT 19: Webhook callback (với validation)
router.post(['/payments/callback', '/callback', '/payments/:id/callback', '/:id/callback'], validateCallback, paymentController.callback);

// Chi tiết thanh toán
router.get(['/payments/:id', '/:id'], paymentController.getPayment);

module.exports = router;
