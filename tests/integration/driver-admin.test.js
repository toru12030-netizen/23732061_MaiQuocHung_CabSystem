const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { apiClient } = require('../helpers/api-client');
const { loginAdmin } = require('../helpers/auth-helper');

describe('Integration Tests - Driver Registration & Admin Management (STT 21 - 23)', () => {
  let adminAuth;
  let testDriverPhone;
  let createdDriverId;

  before(async () => {
    adminAuth = await loginAdmin();
    testDriverPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
  });

  it('STT 21: Đăng ký tài xế (Request OTP -> Verify OTP -> Nộp hồ sơ -> PENDING_APPROVAL)', async () => {
    // 21.1: Nhập số điện thoại -> Yêu cầu cấp OTP
    const otpReq = await apiClient.post('/auth/driver-otp/request', {
      phone: testDriverPhone
    });
    assert.strictEqual(otpReq.status, 200, 'Yêu cầu OTP phải trả về HTTP 200');
    assert.strictEqual(otpReq.data.success, true);
    const otp = otpReq.data.data?.otp || '123456';
    assert.ok(otp, 'Hệ thống phải trả mã OTP');

    // 21.2: Xác thực mã OTP
    const otpVerify = await apiClient.post('/auth/driver-otp/verify', {
      phone: testDriverPhone,
      otp: otp
    });
    assert.strictEqual(otpVerify.status, 200, 'Xác thực OTP phải trả về HTTP 200');
    assert.strictEqual(otpVerify.data.success, true);
    assert.strictEqual(otpVerify.data.data?.verified, true, 'OTP phải được xác nhận thành công');

    // 21.3: Nhập thông tin cá nhân/phương tiện -> Nộp hồ sơ tài xế
    const regRes = await apiClient.post('/auth/register/driver', {
      phone: testDriverPhone,
      fullname: 'Bùi Đức Anh (Tài xế thử nghiệm)',
      vehicleType: 'CAR_4_SEATS',
      licensePlate: `51K-${Math.floor(100 + Math.random() * 900)}.${Math.floor(10 + Math.random() * 90)}`
    });

    assert.strictEqual(regRes.status, 201, 'Nộp hồ sơ tài xế phải trả về HTTP 201 Created');
    assert.strictEqual(regRes.data.success, true);

    const driverData = regRes.data.data;
    createdDriverId = driverData.driverId || driverData.driver?.driverId || driverData.driver?.id || driverData.id;
    assert.ok(createdDriverId, 'Hồ sơ tài xế mới phải có mã ID định danh');

    const approvalStatus = driverData.approvalStatus || driverData.status || driverData.driver?.approvalStatus;
    assert.strictEqual(
      approvalStatus,
      'PENDING_APPROVAL',
      'Hồ sơ tài xế mới đăng ký phải ở trạng thái PENDING_APPROVAL'
    );
  });

  it('STT 22: Quản trị viên duyệt hồ sơ tài xế (Admin Login -> Xem danh sách -> Duyệt hồ sơ)', async () => {
    assert.ok(createdDriverId, 'Cần driverId từ bước STT 21');

    // 22.1: Admin xem danh sách hồ sơ tài xế
    const listRes = await apiClient.get('/admin/drivers', {
      headers: adminAuth.authHeader
    });
    assert.strictEqual(listRes.status, 200, 'Admin lấy danh sách tài xế thành công');
    assert.strictEqual(listRes.data.success, true);
    const drivers = listRes.data.data?.drivers || listRes.data.data;
    assert.ok(Array.isArray(drivers), 'Dữ liệu trả về phải là danh sách tài xế');

    // 22.2: Admin thực hiện duyệt hồ sơ tài xế mới tạo
    const approveRes = await apiClient.put(`/admin/drivers/${createdDriverId}/approval`, {
      status: 'APPROVED'
    }, {
      headers: adminAuth.authHeader
    });

    assert.strictEqual(approveRes.status, 200, 'Duyệt hồ sơ tài xế thành công trả về HTTP 200');
    assert.strictEqual(approveRes.data.success, true);

    const updatedApproval = approveRes.data.data?.approvalStatus || approveRes.data.data?.status;
    assert.strictEqual(updatedApproval, 'APPROVED', 'Trạng thái duyệt hồ sơ phải là APPROVED');
  });

  it('STT 23: Bật/tắt trạng thái nhận chuyến của tài xế (ONLINE <-> OFFLINE)', async () => {
    assert.ok(createdDriverId, 'Cần driverId từ bước STT 21');

    // 23.1: Chuyển trạng thái sang ONLINE (AVAILABLE) để sẵn sàng nhận cuốc
    const onlineRes = await apiClient.put(`/drivers/${createdDriverId}/status`, {
      status: 'AVAILABLE'
    }, {
      headers: adminAuth.authHeader
    });
    assert.strictEqual(onlineRes.status, 200, 'Chuyển ONLINE thành công');
    assert.strictEqual(onlineRes.data.success, true);
    const sOnline = onlineRes.data.data?.status;
    assert.strictEqual(sOnline, 'AVAILABLE', 'Trạng thái hoạt động phải là AVAILABLE');

    // 23.2: Chuyển trạng thái sang OFFLINE để tạm dừng nhận cuốc
    const offlineRes = await apiClient.put(`/drivers/${createdDriverId}/status`, {
      status: 'OFFLINE'
    }, {
      headers: adminAuth.authHeader
    });
    assert.strictEqual(offlineRes.status, 200, 'Chuyển OFFLINE thành công');
    assert.strictEqual(offlineRes.data.success, true);
    const sOffline = offlineRes.data.data?.status;
    assert.strictEqual(sOffline, 'OFFLINE', 'Trạng thái hoạt động phải là OFFLINE');
  });

});
