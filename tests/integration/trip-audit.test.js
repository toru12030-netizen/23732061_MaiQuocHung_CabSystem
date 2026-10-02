const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { apiClient } = require('../helpers/api-client');
const { loginCustomer, loginAdmin } = require('../helpers/auth-helper');

describe('Integration Tests - Trip Service & Audit Service', () => {
  let customerAuth;
  let adminAuth;
  let testTripId;

  before(async () => {
    customerAuth = await loginCustomer();
    adminAuth = await loginAdmin();
  });

  // ============================================================================
  // 1. TRIP SERVICE TESTS
  // ============================================================================
  describe('Trip Service Execution & Real-time GPS Tracking', () => {
    it('Khởi tạo Trip cho chuyến xe (POST /trips)', async () => {
      const payload = {
        bookingId: `ride_test_${Date.now()}`,
        customerId: customerAuth.uid,
        driverId: 'DRV_001',
        vehicleType: 'CAR_4_SEATS',
        pickupAddress: '12 Nguyễn Văn Bảo, Phường 4, Gò Vấp',
        dropoffAddress: 'Sân bay Tân Sơn Nhất',
        pickupLat: 10.8221,
        pickupLng: 106.6868,
        dropoffLat: 10.8184,
        dropoffLng: 106.6588
      };

      const res = await apiClient.post('/trips', payload, {
        headers: customerAuth.authHeader
      });

      assert.ok(res.status === 201 || res.status === 200, `Status must be 200/201, got ${res.status}`);
      assert.strictEqual(res.data.success, true);
      testTripId = res.data.data?.tripId || res.data.data?.id;
      assert.ok(testTripId, 'Trip ID must be returned');
      assert.strictEqual(res.data.data?.driverId, 'DRV_001');
    });

    it('Lấy thông tin chi tiết Trip (GET /trips/:id)', async () => {
      const tripId = testTripId || 'trip_demo_001';
      const res = await apiClient.get(`/trips/${tripId}`, {
        headers: customerAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data?.pickupAddress);
    });

    it('Cập nhật trạng thái chuyến xe (PUT /trips/:id/status -> IN_PROGRESS)', async () => {
      const tripId = testTripId || 'trip_demo_001';
      const res = await apiClient.put(`/trips/${tripId}/status`, {
        status: 'IN_PROGRESS'
      }, {
        headers: customerAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data?.status, 'IN_PROGRESS');
    });

    it('Gửi tọa độ GPS thời gian thực (POST /trips/:id/location)', async () => {
      const tripId = testTripId || 'trip_demo_001';
      const res = await apiClient.post(`/trips/${tripId}/location`, {
        lat: 10.8205,
        lng: 106.6820,
        speed: 40,
        bearing: 250
      }, {
        headers: customerAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data?.lat, 10.8205);
    });

    it('Lấy vị trí GPS mới nhất và ETA dự kiến (GET /trips/:id/location)', async () => {
      const tripId = testTripId || 'trip_demo_001';
      const res = await apiClient.get(`/trips/${tripId}/location`, {
        headers: customerAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data?.currentLocation);
      assert.ok(typeof res.data.data?.etaMinutes === 'number');
    });

    it('Lấy toàn bộ lộ trình GPS breadcrumbs (GET /trips/:id/route)', async () => {
      const tripId = testTripId || 'trip_demo_001';
      const res = await apiClient.get(`/trips/${tripId}/route`, {
        headers: customerAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data?.route));
    });
  });

  // ============================================================================
  // 2. AUDIT SERVICE TESTS
  // ============================================================================
  describe('Audit Service Centralized Compliance & Security Events', () => {
    it('Ghi nhận nhật ký kiểm toán mới (POST /audit/logs)', async () => {
      const res = await apiClient.post('/audit/logs', {
        action: 'DRIVER_LICENSE_VERIFIED',
        resource: 'drivers/DRV_001',
        userId: adminAuth.uid,
        username: adminAuth.username,
        details: { verifiedBy: 'Admin QA', status: 'VERIFIED' }
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data?.action, 'DRIVER_LICENSE_VERIFIED');
    });

    it('Admin truy vấn nhật ký kiểm toán hệ thống (GET /admin/audit-logs)', async () => {
      const res = await apiClient.get('/admin/audit-logs?limit=10&page=1', {
        headers: adminAuth.authHeader
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const logs = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.logs || []);
      assert.ok(Array.isArray(logs), 'Audit logs must be an array');
      assert.ok(logs.length >= 1, 'There must be at least 1 audit log');
    });

    it('Ghi nhận và tra cứu sự kiện an ninh bảo mật (POST & GET /audit/security-events)', async () => {
      // 1. Ghi nhận sự kiện tấn công
      const postRes = await apiClient.post('/audit/security-events', {
        eventType: 'SUSPICIOUS_TOKEN_DETECTED',
        severity: 'HIGH',
        targetEndpoint: 'GET /admin/drivers',
        details: { reason: 'Malformed signature rejected by gRPC' }
      });

      assert.strictEqual(postRes.status, 201);
      assert.strictEqual(postRes.data.success, true);

      // 2. Admin tra cứu sự kiện bảo mật
      const getRes = await apiClient.get('/audit/security-events', {
        headers: adminAuth.authHeader
      });

      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.data.success, true);
      assert.ok(Array.isArray(getRes.data.data?.events));
    });

    it('Chặn khách hàng truy cập trái phép Audit Logs (RBAC: HTTP 403)', async () => {
      const res = await apiClient.get('/admin/audit-logs', {
        headers: customerAuth.authHeader // Role member
      });

      assert.strictEqual(
        res.status,
        403,
        `Customer không được quyền xem audit logs (phải trả về 403 Forbidden). Got: ${res.status}`
      );
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.error?.code, 'FORBIDDEN');
    });
  });
});
