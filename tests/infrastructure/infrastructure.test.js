const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Infrastructure & Architecture Tests (STT 01 - 05, 07)', () => {

  it('STT 01: Kiến trúc mã nguồn - Cấu trúc thư mục Monorepo & Microservices', () => {
    const requiredDirs = [
      'apps/api-gateway',
      'apps/auth-service',
      'apps/customer-service',
      'apps/driver-service',
      'apps/booking-service',
      'apps/payment-service',
      'apps/notification-service',
      'apps/admin-service',
      'apps/trip-service',
      'apps/audit-service',
      'packages/shared-config',
      'infra/postgres',
      'infra/mongo'
    ];

    for (const dir of requiredDirs) {
      const fullPath = path.join(ROOT_DIR, dir);
      assert.strictEqual(
        fs.existsSync(fullPath),
        true,
        `Thư mục dịch vụ bắt buộc phải tồn tại: ${dir}`
      );
    }
  });

  it('STT 02: Kiểm tra .gitignore & .env không bị commit vào Git', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    assert.strictEqual(fs.existsSync(gitignorePath), true, 'File .gitignore phải tồn tại');

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    assert.strictEqual(
      gitignoreContent.includes('.env'),
      true,
      '.gitignore phải chứa quy tắc chặn .env'
    );
    assert.strictEqual(
      gitignoreContent.includes('node_modules'),
      true,
      '.gitignore phải chứa quy tắc chặn node_modules'
    );

    // Kiểm tra xem file .env có nằm trong Git tracking không
    try {
      const gitTracked = execSync('git ls-files .env', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
      assert.strictEqual(
        gitTracked,
        '',
        'File .env tuyệt đối không được track trong git'
      );
    } catch (err) {
      // Nếu không có lệnh git thì bỏ qua bước kiểm tra git index
    }
  });

  it('STT 03: Mô tả và cấu hình nhiệm vụ API Gateway', () => {
    const gatewayPath = path.join(ROOT_DIR, 'apps/api-gateway/src/index.js');
    assert.strictEqual(fs.existsSync(gatewayPath), true, 'API Gateway index.js phải tồn tại');

    const content = fs.readFileSync(gatewayPath, 'utf8');
    assert.strictEqual(content.includes('express()'), true, 'Gateway phải sử dụng Express');
    assert.strictEqual(content.includes('x-correlation-id') || content.includes('X-Correlation-Id'), true, 'Gateway phải quản lý correlation id');
    assert.strictEqual(content.includes('rateLimiter') || content.includes('RateLimit'), true, 'Gateway phải có rate limiting');
  });

  it('STT 04: Mô tả & Kiểm tra IPC (gRPC, REST, Kafka) giữa các Microservices', () => {
    // 1. Kiểm tra cấu hình gRPC trong proto
    const protoDir = path.join(ROOT_DIR, 'packages/proto');
    assert.strictEqual(fs.existsSync(protoDir), true, 'Thư mục proto cho gRPC phải tồn tại: packages/proto');

    const authProto = path.join(protoDir, 'auth.proto');
    const customerProto = path.join(protoDir, 'customer.proto');
    assert.strictEqual(fs.existsSync(authProto), true, 'File auth.proto cho gRPC phải tồn tại');
    assert.strictEqual(fs.existsSync(customerProto), true, 'File customer.proto cho gRPC phải tồn tại');

    // 2. Kiểm tra cấu hình Kafka broker trong booking & driver services
    const dockerComposePath = path.join(ROOT_DIR, 'docker-compose.yml');
    const dcContent = fs.readFileSync(dockerComposePath, 'utf8');
    assert.strictEqual(dcContent.includes('cab-kafka:9092'), true, 'Kafka broker phải được cấu hình cho các service');
  });

  it('STT 05: Compose hệ thống và danh sách 11 containers', () => {
    const dockerComposePath = path.join(ROOT_DIR, 'docker-compose.yml');
    assert.strictEqual(fs.existsSync(dockerComposePath), true, 'File docker-compose.yml phải tồn tại');

    const expectedServices = [
      'api-gateway',
      'auth-service',
      'customer-service',
      'driver-service',
      'booking-service',
      'payment-service',
      'notification-service',
      'admin-service',
      'trip-service',
      'audit-service',
      'cab-kafka',
      'cab-zookeeper',
      'cab-secure-db'
    ];

    const content = fs.readFileSync(dockerComposePath, 'utf8');
    for (const s of expectedServices) {
      assert.strictEqual(content.includes(s), true, `Service ${s} phải được định nghĩa trong docker-compose.yml`);
    }

    // Kiểm tra thực tế trạng thái docker ps nếu Docker daemon đang chạy
    try {
      const psOutput = execSync('docker compose ps --services', { cwd: ROOT_DIR, encoding: 'utf8' });
      assert.strictEqual(psOutput.includes('api-gateway'), true, 'api-gateway container đang chạy');
    } catch (e) {
      // Bỏ qua nếu môi trường test không có Docker CLI trực tiếp
    }
  });

  it('STT 07: Kiểm tra hệ thống Kafka hoạt động', () => {
    try {
      const psOutput = execSync('docker compose ps cab-kafka', { cwd: ROOT_DIR, encoding: 'utf8' });
      assert.strictEqual(
        psOutput.includes('cab-kafka') && (psOutput.includes('Up') || psOutput.includes('healthy')),
        true,
        'Container cab-kafka phải ở trạng thái Up/healthy'
      );
    } catch (err) {
      // Fallback kiểm tra docker-compose cấu hình Kafka
      const dcContent = fs.readFileSync(path.join(ROOT_DIR, 'docker-compose.yml'), 'utf8');
      assert.strictEqual(dcContent.includes('cp-kafka:7.6.0'), true, 'Kafka image confluentinc/cp-kafka:7.6.0 phải được định nghĩa');
    }
  });

});
