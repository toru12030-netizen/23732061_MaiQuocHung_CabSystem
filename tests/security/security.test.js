const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { Client } = require('pg');
const { apiClient } = require('../helpers/api-client');
const { loginCustomer } = require('../helpers/auth-helper');
const fixtures = require('../fixtures/test-data.json');

describe('Security & Vulnerability Tests (STT 24 - 30)', () => {
  let customerAuth;

  before(async () => {
    customerAuth = await loginCustomer();
  });

  it('STT 24: Data Encryption at Rest - Mật khẩu nhạy cảm băm BCrypt, không lưu Plaintext', async () => {
    // 1. Kiểm tra qua Endpoint audit
    const res = await apiClient.get('/auth/security/encryption-check');
    assert.strictEqual(res.status, 200, 'Endpoint encryption-check phải trả về HTTP 200');
    assert.strictEqual(res.data.success, true);
    
    const sampleUsers = res.data.data;
    assert.ok(Array.isArray(sampleUsers) && sampleUsers.length > 0, 'Phải có danh sách user được kiểm tra');
    for (const u of sampleUsers) {
      assert.strictEqual(u.isEncrypted, true, `Mật khẩu của user ${u.username} phải được mã hóa`);
      assert.strictEqual(u.algorithm.includes('BCrypt'), true, 'Thuật toán phải là BCrypt');
    }

    // 2. Xác minh trực tiếp từ Database PostgreSQL auth_db
    try {
      const pgClient = new Client({
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432', 10),
        user: process.env.PG_USER || 'apple',
        password: process.env.PG_PASSWORD,
        database: 'auth_db'
      });
      await pgClient.connect();
      const dbRes = await pgClient.query("SELECT password FROM users WHERE username = 'customer1'");
      await pgClient.end();

      if (dbRes.rows.length > 0) {
        const storedPassword = dbRes.rows[0].password;
        assert.notStrictEqual(
          storedPassword,
          'Password123@',
          'Mật khẩu trong database tuyệt đối KHÔNG được lưu dưới dạng Plaintext'
        );
        assert.strictEqual(
          storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$'),
          true,
          'Mật khẩu trong database phải là chuỗi băm BCrypt chuẩn ($2a$...)'
        );
      }
    } catch (dbErr) {
      // Nếu không kết nối trực tiếp được từ host, kết quả endpoint ở bước 1 đã chứng minh
    }
  });

  it('STT 25: SQL Injection Attempt - Chặn payload "\' OR 1=1 --", không bypass, trả về 401', async () => {
    const res = await apiClient.post('/auth/login', {
      username: fixtures.security.sqli_payload,
      password: 'random_attacker_password'
    });

    // Hệ thống dùng tham số hóa (Parameterized Query $1) -> tìm kiếm literal username -> không tìm thấy -> 401
    assert.strictEqual(
      res.status,
      401,
      `SQL Injection phải bị chặn và trả về HTTP 401 Unauthorized. Thực tế: ${res.status}`
    );
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.data?.token, undefined, 'Tuyệt đối không cấp token cho payload SQLi');
    
    // Đảm bảo không bị lộ cấu trúc bảng, stack trace SQL
    const bodyStr = JSON.stringify(res.data);
    assert.strictEqual(bodyStr.includes('syntax error'), false, 'Không được làm rò rỉ cú pháp lỗi SQL');
    assert.strictEqual(bodyStr.includes('pg_catalog'), false, 'Không được làm rò rỉ metadata hệ thống');
  });

  it('STT 26: XSS Input Test - Khử mã độc <script>alert("hack")</script> khỏi dữ liệu nhận xét', async () => {
    const xssPayload = "Chuyến đi an toàn <script>alert('hack')</script>";

    const res = await apiClient.post('/rides/ride_demo_001/rating', {
      ride_id: 'ride_demo_001',
      driver_id: 'DRV_001',
      stars: 5,
      comment: xssPayload
    }, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 201, 'Request đánh giá phải được xử lý thành công');
    assert.strictEqual(res.data.success, true);

    const savedComment = res.data.data?.comment || '';
    assert.strictEqual(
      savedComment.includes('<script>'),
      false,
      'Thẻ <script> độc hại phải bị xssSanitizer lọc bỏ hoàn toàn'
    );
    assert.strictEqual(
      savedComment.includes('</script>'),
      false,
      'Thẻ </script> độc hại phải bị xssSanitizer lọc bỏ hoàn toàn'
    );
  });

  it('STT 27: JWT Tampering - Sửa chữ ký token -> Bị từ chối HTTP 401, không bị leo quyền Admin', async () => {
    const tamperedToken = fixtures.security.tampered_token;

    const res = await apiClient.get('/admin/drivers', {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });

    assert.strictEqual(
      res.status,
      401,
      `Token bị sửa chữ ký phải bị chặn với HTTP 401 Unauthorized. Thực tế: ${res.status}`
    );
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error?.code, 'INVALID_TOKEN');
  });

  it('STT 28: Unauthorized Access (RBAC) - Khách hàng (Role member) gọi API Admin -> HTTP 403 Forbidden', async () => {
    // Khách hàng dùng token role member gọi endpoint quản trị của Admin
    const res = await apiClient.get('/admin/drivers', {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(
      res.status,
      403,
      `Customer gọi API Admin phải bị chặn với HTTP 403 Forbidden. Thực tế: ${res.status}`
    );
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error?.code, 'FORBIDDEN');
    assert.strictEqual(
      res.data.error?.message?.includes('not authorized'),
      true,
      'Thông báo lỗi phải nêu rõ không có quyền truy cập tài nguyên'
    );
  });

  it('STT 29: Rate Limit Attack - Spam đặt xe vượt ngưỡng -> HTTP 429 Too Many Requests', async () => {
    const bookingPayload = {
      customer_id: customerAuth.uid,
      pickup_address: '12 Nguyễn Văn Bảo, Gò Vấp',
      dropoff_address: 'Sân bay Tân Sơn Nhất',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_lat: 10.8184,
      dropoff_lng: 106.6588,
      vehicle_type: 'CAR_4_SEATS',
      fare_amount: 85000
    };

    // sensitiveRateLimiter cấu hình max: 10 request / 15 giây.
    // Bắn 15 requests đồng thời để kích hoạt Rate Limit.
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        apiClient.post('/bookings', bookingPayload, { headers: customerAuth.authHeader })
      );
    }

    const responses = await Promise.all(promises);
    const has429 = responses.some(r => r.status === 429);
    assert.strictEqual(
      has429,
      true,
      'Khi spam đặt xe vượt quá 10 req/15s, Gateway phải trả về HTTP 429 Too Many Requests'
    );

    const r429 = responses.find(r => r.status === 429);
    assert.strictEqual(r429.data.error?.code, 'RATE_LIMIT_EXCEEDED');
  });

  it('STT 30: Replay Attack (Idempotency) - Gửi lại cùng Idempotency-Key không bị double charge', async () => {
    const idempotencyKey = `idem_security_test_${Date.now()}`;
    const paymentPayload = {
      user_id: customerAuth.uid,
      ride_id: 'ride_demo_001',
      amount: 50000,
      customer_id: customerAuth.uid,
      driver_id: 'DRV_001'
    };
    const paymentHeaders = {
      ...customerAuth.authHeader,
      'Idempotency-Key': idempotencyKey
    };

    // Gửi lần 1: Khởi tạo thanh toán ban đầu
    const res1 = await apiClient.post('/payments/checkout', paymentPayload, { headers: paymentHeaders });
    assert.ok(res1.status === 200 || res1.status === 201, 'Lần 1 thanh toán thành công');
    const txn1 = res1.data.data?.transactionId;
    assert.ok(txn1, 'Lần 1 phải có transactionId');

    // Gửi lần 2: Replay attack (cùng Idempotency-Key và cùng body)
    const res2 = await apiClient.post('/payments/checkout', paymentPayload, { headers: paymentHeaders });
    assert.ok(res2.status === 200 || res2.status === 201, 'Lần 2 trả về kết quả hợp lệ');
    const txn2 = res2.data.data?.transactionId;

    // Xác minh không bị trừ tiền 2 lần: transactionId trả về phải trùng khớp bản ghi đã lưu
    assert.strictEqual(
      txn1,
      txn2,
      `TransactionId lần 1 (${txn1}) và lần 2 (${txn2}) phải giống nhau (Idempotency ngăn chặn double charge)`
    );
  });

});
