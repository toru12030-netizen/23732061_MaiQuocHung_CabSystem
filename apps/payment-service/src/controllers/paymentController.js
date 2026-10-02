const paymentService = require('../services/paymentService');
const { sendError } = require('@cab/shared-config');

const paymentController = {
  // Lấy bảng giá
  async getPricing(req, res) {
    try {
      const data = await paymentService.getPricingConfigs();
      return res.status(200).json({
        success: true,
        message: 'Pricing configurations retrieved',
        data
      });
    } catch (err) {
      console.error('[PAYMENT_CONTROLLER] getPricing error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  },

  // STT 19 & STT 30: Checkout thanh toán online
  async checkout(req, res) {
    try {
      const crypto = require('crypto');
      const { ride_id, amount, method, customer_id, user_id, driver_id } = req.body;
      const custId = customer_id || user_id || req.headers['x-user-id'] || 'usr_cust_001';

      // Tạo hash tự động từ payload để chống replay attack ngay cả khi không gửi header Idempotency-Key
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify({
        uid: custId,
        rid: ride_id,
        amt: amount
      })).digest('hex');

      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotency_key || `idem_auto_${payloadHash}`;

      const result = await paymentService.processCheckout({
        rideId: ride_id,
        amount,
        method,
        customerId: custId,
        driverId: driver_id,
        idempotencyKey,
        requestBody: req.body
      });

      return res.status(result.statusCode).json(result.payload);
    } catch (err) {
      console.error('[PAYMENT_CONTROLLER] checkout error:', err);
      return sendError(res, 500, 'PAYMENT_CHECKOUT_FAILED', err.message);
    }
  },

  // STT 19: Callback webhook
  async callback(req, res) {
    try {
      const paymentId = req.params.id || req.body.payment_id || req.body.paymentId;
      const { status, transaction_id } = req.body;

      const updatedPayment = await paymentService.processCallback({
        paymentId,
        status,
        transactionId: transaction_id
      });

      if (!updatedPayment) {
        return sendError(res, 404, 'NOT_FOUND', `Payment record not found for: ${paymentId}`);
      }

      return res.status(200).json({
        success: true,
        message: `Payment marked as ${updatedPayment.status}`,
        data: updatedPayment
      });
    } catch (err) {
      console.error('[PAYMENT_CONTROLLER] callback error:', err);
      return sendError(res, 500, 'CALLBACK_FAILED', err.message);
    }
  },

  // Lấy chi tiết payment
  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        return sendError(res, 404, 'NOT_FOUND', `Payment not found with identifier: ${id}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment details retrieved',
        data: payment
      });
    } catch (err) {
      console.error('[PAYMENT_CONTROLLER] getPayment error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  }
};

module.exports = paymentController;
