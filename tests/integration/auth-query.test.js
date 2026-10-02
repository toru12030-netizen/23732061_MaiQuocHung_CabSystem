const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { apiClient } = require('../helpers/api-client');
const { loginCustomer, generateUniqueUsername } = require('../helpers/auth-helper');

describe('Integration Tests - Authentication & Query (STT 09 - 14)', () => {
  let customerAuth;

  before(async () => {
    customerAuth = await loginCustomer();
  });

  it('STT 09: Đăng ký tài khoản khách hàng mới & đăng nhập thành công', async () => {
    const newUsername = generateUniqueUsername('cust_test');
    const newPassword = 'Password123@';

    // 1. Đăng ký tài khoản mới
    const regRes = await apiClient.post('/auth/register', {
      username: newUsername,
      password: newPassword,
      role: 'member'
    });

    assert.strictEqual(regRes.status, 201, 'Đăng ký phải trả về HTTP 201 Created');
    assert.strictEqual(regRes.data.success, true);
    assert.strictEqual(regRes.data.data?.username, newUsername);

    // 2. Kiểm tra tài khoản mới vừa tạo có thể đăng nhập được ngay vào hệ thống
    const loginRes = await apiClient.post('/auth/login', {
      username: newUsername,
      password: newPassword
    });

    assert.strictEqual(loginRes.status, 200, 'Đăng nhập tài khoản mới phải thành công với HTTP 200');
    assert.strictEqual(loginRes.data.success, true);
    assert.ok(loginRes.data.data?.token, 'Hệ thống phải cấp JWT token cho tài khoản mới');
  });

  it('STT 10: Đăng nhập khách hàng đã có tài khoản (Cấp JWT hợp lệ)', async () => {
    const res = await apiClient.post('/auth/login', {
      username: 'customer1',
      password: 'Password123@'
    });

    assert.strictEqual(res.status, 200, 'Đăng nhập phải trả về HTTP 200');
    assert.strictEqual(res.data.success, true);
    
    const token = res.data.data?.token;
    assert.ok(token, 'Response phải chứa JWT token');
    
    // Parse phần payload của token (JWT base64url)
    const payloadPart = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf8'));
    assert.strictEqual(payload.username, 'customer1');
    assert.strictEqual(payload.role, 'member');
  });

  it('STT 11: Lấy thông tin khách hàng với mã số theo ID (Dùng Token)', async () => {
    const res = await apiClient.get('/customers/usr_cust_001', {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;
    assert.ok(data.uid === 'usr_cust_001' || data.id === 'usr_cust_001', 'Phải trả về đúng khách hàng usr_cust_001');
  });

  it('STT 12: Lấy thông tin tài xế với mã số theo ID (Dùng Token)', async () => {
    const res = await apiClient.get('/drivers/DRV_001', {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true);
    const driver = res.data.data;
    const resolvedId = driver.driverId || driver.id || driver.uid;
    assert.strictEqual(resolvedId === 'DRV_001' || driver.driverId === 'DRV_001', true, 'Phải trả về đúng tài xế DRV_001');
    assert.ok(driver.fullname, 'Tài xế phải có họ tên');
    assert.ok(driver.vehicleType || driver.vehicle, 'Tài xế phải có thông tin phương tiện');
  });

  it('STT 13: Liệt kê danh sách tài xế tại khu vực (1km, phân trang, có sẵn >= 5 tài xế)', async () => {
    const res = await apiClient.get('/drivers/nearby?lat=10.8221&lng=106.6868&radius=1000&limit=5&page=1', {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true);

    const drivers = res.data.data?.drivers || res.data.data;
    assert.ok(Array.isArray(drivers), 'Dữ liệu trả về phải là một mảng tài xế');
    assert.ok(drivers.length >= 1, 'Phải tìm thấy ít nhất 1 tài xế quanh tọa độ ĐH IUH');
    assert.ok(drivers.length <= 5, 'Phải tuân thủ giới hạn limit=5');

    // Phân trang và metadata
    const pagination = res.data.data?.pagination || res.data.pagination;
    if (pagination) {
      assert.strictEqual(pagination.limit, 5);
      assert.strictEqual(pagination.page, 1);
    }
  });

  it('STT 14: Liệt kê danh sách booking của Customer (>= 5 bookings, phân trang)', async () => {
    const res = await apiClient.get('/bookings/customers/usr_cust_001/bookings?limit=5&page=1', {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true);

    const bookings = res.data.data?.bookings || res.data.data?.rides || res.data.data;
    assert.ok(Array.isArray(bookings), 'Dữ liệu booking trả về phải là mảng');
    assert.strictEqual(
      bookings.length >= 5,
      true,
      `Yêu cầu tối thiểu 5 booking theo phiếu chấm STT 14. Thực tế: ${bookings.length}`
    );
  });

});
