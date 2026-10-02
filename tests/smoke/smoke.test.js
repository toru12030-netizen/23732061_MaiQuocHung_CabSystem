const { describe, it } = require('node:test');
const assert = require('node:assert');
const { apiClient } = require('../helpers/api-client');

describe('Smoke Tests - Health Check & Gateway Routing (STT 06, 08)', () => {

  it('STT 06.1: Smoke Health - GET /health trả trạng thái healthy và gateway UP', async () => {
    const res = await apiClient.get('/health');
    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true, 'success phải là true');
    assert.strictEqual(res.data.data?.status, 'healthy', 'Trạng thái tổng thể phải là healthy');
    assert.strictEqual(res.data.data?.gateway, 'UP', 'API Gateway phải ở trạng thái UP');
  });

  it('STT 06.2: Smoke Ready - GET /ready trả trạng thái ready', async () => {
    const res = await apiClient.get('/ready');
    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true, 'success phải là true');
    assert.strictEqual(res.data.data?.status, 'ready', 'Trạng thái phải là ready');
    assert.strictEqual(res.data.data?.gateway, 'READY', 'Gateway phải ở trạng thái READY');
  });

  it('STT 06.3: Smoke Microservices Health - GET /health/services báo cáo đầy đủ các microservices', async () => {
    const res = await apiClient.get('/health/services');
    assert.strictEqual(res.status, 200, 'HTTP Status phải là 200');
    assert.strictEqual(res.data.success, true, 'success phải là true');
    
    const services = res.data.data?.services;
    assert.ok(services, 'Phải có danh sách services trong response data');
    assert.strictEqual(services.auth, 'UP', 'auth-service phải ở trạng thái UP');
    assert.strictEqual(services.driver, 'UP', 'driver-service phải ở trạng thái UP');
    assert.strictEqual(services.booking, 'UP', 'booking-service phải ở trạng thái UP');
    assert.strictEqual(services.payment, 'UP', 'payment-service phải ở trạng thái UP');
    assert.strictEqual(services.notification, 'UP', 'notification-service phải ở trạng thái UP');
    assert.strictEqual(services.admin, 'UP', 'admin-service phải ở trạng thái UP');
  });

  it('STT 08: Kiểm tra mọi request đều đi qua Gateway (X-Correlation-Id & RateLimit Headers)', async () => {
    const res = await apiClient.get('/health');
    
    // Gateway phải tự sinh X-Correlation-Id duy nhất cho mỗi request
    const correlationId = res.headers['x-correlation-id'];
    assert.ok(correlationId, 'Response header phải chứa x-correlation-id từ Gateway');
    assert.strictEqual(
      correlationId.startsWith('corr_'),
      true,
      `x-correlation-id phải có tiền tố corr_: ${correlationId}`
    );

    // Gateway phải có RateLimit headers quản lý bởi globalRateLimiter
    const rateLimit = res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit'];
    assert.ok(rateLimit, 'Response header phải chứa RateLimit-Limit');
  });

});
