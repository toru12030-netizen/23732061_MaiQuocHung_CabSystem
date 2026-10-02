const { sendError } = require('@cab/shared-config');

/**
 * Middleware kiểm tra dữ liệu đầu vào cho Payment Service
 */
function validateCheckout(req, res, next) {
  let { ride_id, user_id, customer_id, amount } = req.body;
  if (!ride_id && !user_id && !customer_id) {
    return sendError(res, 400, 'MISSING_IDENTIFIER', 'ride_id or user_id is required for checkout');
  }
  if (!ride_id) {
    req.body.ride_id = `ride_${user_id || customer_id || 'guest'}`;
  }
  const numAmount = parseInt(amount, 10);
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return sendError(res, 400, 'INVALID_AMOUNT', 'amount must be a positive integer');
  }
  next();
}

function validateCallback(req, res, next) {
  const paymentId = req.params.id || req.body.payment_id || req.body.paymentId;
  if (!paymentId) {
    return sendError(res, 400, 'MISSING_PAYMENT_ID', 'payment_id is required');
  }
  next();
}

module.exports = {
  validateCheckout,
  validateCallback
};
