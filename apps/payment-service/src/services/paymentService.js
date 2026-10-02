const crypto = require('crypto');
const PaymentModel = require('../models/paymentModel');
const PricingModel = require('../models/pricingModel');
const IdempotencyModel = require('../models/idempotencyModel');
const { publishPaymentCompleted } = require('../events/paymentProducer');

/**
 * Lấy bảng giá các loại phương tiện
 */
async function getPricingConfigs() {
  return PricingModel.getActiveConfigs();
}

/**
 * Khởi tạo giao dịch thanh toán online có hỗ trợ Idempotency chống Replay Attack (STT 19 & STT 30)
 */
async function processCheckout({ rideId, amount, method = 'online_banking', customerId, driverId, idempotencyKey, requestBody }) {
  // 1. Kiểm tra Idempotency cache (chống Replay Attack STT 30)
  if (idempotencyKey) {
    const cached = await IdempotencyModel.findByKey(idempotencyKey);
    if (cached) {
      console.log(`[PAYMENT_IDEMPOTENCY] Replay attack detected for key '${idempotencyKey}'. Returning cached response.`);
      return {
        isReplay: true,
        statusCode: cached.status_code,
        payload: cached.response_payload
      };
    }
  }

  // 2. Tạo bản ghi giao dịch thanh toán mới
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const txnId = `TXN_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const paymentData = await PaymentModel.create({
    id: paymentId,
    rideId,
    customerId,
    driverId: driverId || 'DRV_001',
    amount,
    method,
    transactionId: txnId
  });

  const responsePayload = {
    success: true,
    message: 'Payment initialized successfully',
    data: {
      payment: paymentData,
      checkoutUrl: `https://sandbox.vnpay.vn/payment/gateway?txn=${txnId}&amount=${amount}`,
      transactionId: txnId,
      idempotencyKeyUsed: idempotencyKey || null
    }
  };

  // 3. Lưu vào bảng idempotency_records nếu có Idempotency-Key
  if (idempotencyKey) {
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex');
    await IdempotencyModel.saveRecord({
      key: idempotencyKey,
      userId: customerId,
      requestHash,
      responsePayload,
      statusCode: 201
    });
  }

  return {
    isReplay: false,
    statusCode: 201,
    payload: responsePayload
  };
}

/**
 * Xử lý Webhook callback thanh toán hoàn tất (STT 19)
 */
async function processCallback({ paymentId, status = 'COMPLETED', transactionId }) {
  const updatedPayment = await PaymentModel.markCompleted(paymentId, transactionId);
  if (!updatedPayment) return null;

  // Bắn sự kiện lên Kafka khi thanh toán thành công
  if (status.toUpperCase() === 'COMPLETED') {
    publishPaymentCompleted(updatedPayment);
  }

  return updatedPayment;
}

/**
 * Lấy thông tin thanh toán theo ID
 */
async function getPaymentById(id) {
  return PaymentModel.findById(id);
}

module.exports = {
  getPricingConfigs,
  processCheckout,
  processCallback,
  getPaymentById
};
