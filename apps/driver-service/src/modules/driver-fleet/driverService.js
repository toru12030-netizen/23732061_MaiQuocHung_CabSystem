const DriverModel = require('../../models/driverModel');
const { publishDriverStatusChanged } = require('../../events/driverProducer');

// In-memory OTP storage for demo / testing
const otpStore = new Map();

async function getDriverById(id) {
  return DriverModel.findById(id);
}

async function updateDriverStatus(id, status) {
  const updated = await DriverModel.updateStatus(id, status);
  if (updated) {
    publishDriverStatusChanged(id, status.toUpperCase());
  }
  return updated;
}

// STT 21: Yêu cầu mã OTP
async function requestOtp(phone) {
  const otp = '123456'; // Default test OTP
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { phone, otp, message: `OTP sent to ${phone}` };
}

// STT 21: Xác thực mã OTP
async function verifyOtp(phone, otp) {
  const record = otpStore.get(phone);
  if (otp === '123456' || (record && record.otp === otp && record.expiresAt > Date.now())) {
    otpStore.delete(phone);
    return { verified: true };
  }
  return { verified: false, message: 'Invalid or expired OTP' };
}

// STT 21: Gửi hồ sơ đăng ký tài xế (Trạng thái PENDING_APPROVAL)
async function registerDriver(data) {
  return DriverModel.createPendingDriver(data);
}

// STT 22: Quản trị viên duyệt hồ sơ tài xế
async function approveDriver(driverId, approvalStatus) {
  const result = await DriverModel.updateApproval(driverId, approvalStatus);
  if (result) {
    publishDriverStatusChanged(driverId, result.status);
  }
  return result;
}

module.exports = {
  getDriverById,
  updateDriverStatus,
  requestOtp,
  verifyOtp,
  registerDriver,
  approveDriver
};
