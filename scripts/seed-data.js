/**
 * Master Database Seeding Script for IUH MSA Cab System
 * Aligned 100% with phieucham.md (STT 1 - STT 30)
 * 
 * Target Databases:
 * 1. PostgreSQL (localhost:5432): auth_db, booking_db, payment_db
 * 2. MongoDB    (localhost:27017): customer_db, driver_db, notification_db, admin_db
 */

const { Client } = require('pg');
const { MongoClient } = require('mongodb');

// BCrypt hash for password: "Password123@"
const HASHED_PASSWORD = '$2a$10$QdHCDUilyl5Efh1AF4e92O/Olwt4voUozD889nr0FQWP5QFdMUObi';

async function seedPostgres() {
  console.log('🚀 [POSTGRES] Starting PostgreSQL Seeding on localhost:5432...');

  // 1. SEED auth_db
  console.log('--- Seeding auth_db ---');
  const authClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'apple',
    password: process.env.PG_PASSWORD,
    database: 'auth_db'
  });
  await authClient.connect();

  // Clear existing mock data except case2_user/admin if needed, or upsert
  const users = [
    { uid: 'usr_cust_001', username: 'customer1', role: 'member' },
    { uid: 'usr_cust_002', username: 'customer2', role: 'member' },
    { uid: 'usr_cust_003', username: 'customer3', role: 'member' },
    { uid: 'usr_cust_004', username: 'customer4', role: 'member' },
    { uid: 'usr_cust_005', username: 'customer5', role: 'member' },
    { uid: 'usr_drv_001', username: 'driver_tuan', role: 'member' },
    { uid: 'usr_drv_002', username: 'driver_nam', role: 'member' },
    { uid: 'usr_drv_003', username: 'driver_hai', role: 'member' },
    { uid: 'usr_drv_004', username: 'driver_minh', role: 'member' },
    { uid: 'usr_drv_005', username: 'driver_hoang', role: 'member' },
    { uid: 'usr_admin_001', username: 'admin_hung', role: 'admin' },
    { uid: 'usr_admin_002', username: 'admin_system', role: 'admin' },
    { uid: 'usr_case2_user', username: 'case2_user', role: 'member' },
    { uid: 'usr_case2_admin', username: 'case2_admin', role: 'admin' }
  ];

  for (const u of users) {
    await authClient.query(`
      INSERT INTO users (uid, username, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO UPDATE 
      SET password = EXCLUDED.password, role = EXCLUDED.role;
    `, [u.uid, u.username, HASHED_PASSWORD, u.role]);
  }
  console.log(`✅ auth_db.users: Seeded ${users.length} users with Bcrypt encrypted passwords.`);

  // Sample token blacklist for logout verification
  await authClient.query(`
    INSERT INTO token_blacklist (token, uid, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '2 hours')
    ON CONFLICT DO NOTHING;
  `, ['sample_revoked_jwt_token_phieucham_smoke_test', 'usr_cust_001']);
  console.log('✅ auth_db.token_blacklist: Seeded sample revoked token.');
  await authClient.end();

  // 2. SEED booking_db
  console.log('--- Seeding booking_db ---');
  const bookingClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'apple',
    password: process.env.PG_PASSWORD,
    database: 'booking_db'
  });
  await bookingClient.connect();

  const rides = [
    {
      id: 'ride_comp_001',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_001',
      vehicle_type: 'sedan',
      status: 'completed',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'Sân bay Quốc tế Tân Sơn Nhất, Tan Binh, TP.HCM',
      dropoff_lat: 10.8185,
      dropoff_lng: 106.6588,
      estimated_distance: 6.2,
      estimated_duration: 18,
      estimated_fare: 89000,
      actual_distance: 6.3,
      actual_duration: 20,
      actual_fare: 89000
    },
    {
      id: 'ride_comp_002',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_002',
      vehicle_type: 'suv',
      status: 'completed',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'Landmark 81, Vinhomes Central Park, Binh Thanh, TP.HCM',
      dropoff_lat: 10.7950,
      dropoff_lng: 106.7218,
      estimated_distance: 9.8,
      estimated_duration: 25,
      estimated_fare: 167000,
      actual_distance: 10.1,
      actual_duration: 28,
      actual_fare: 167000
    },
    {
      id: 'ride_prog_003',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_004',
      vehicle_type: 'van',
      status: 'in_progress',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'Chợ Bến Thành, Le Loi, Quan 1, TP.HCM',
      dropoff_lat: 10.7720,
      dropoff_lng: 106.6983,
      estimated_distance: 8.5,
      estimated_duration: 30,
      estimated_fare: 183000,
      actual_distance: null,
      actual_duration: null,
      actual_fare: null
    },
    {
      id: 'ride_asgn_004',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_003',
      vehicle_type: 'sedan',
      status: 'assigned',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'AEON Mall Tan Phu Celadon, Tan Phu, TP.HCM',
      dropoff_lat: 10.8012,
      dropoff_lng: 106.6165,
      estimated_distance: 11.2,
      estimated_duration: 32,
      estimated_fare: 149000,
      actual_distance: null,
      actual_duration: null,
      actual_fare: null
    },
    {
      id: 'ride_canc_005',
      customer_id: 'usr_cust_001',
      driver_id: null,
      vehicle_type: 'sedan',
      status: 'cancelled',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'Bến xe Miền Đông, Dinh Bo Linh, Binh Thanh, TP.HCM',
      dropoff_lat: 10.8142,
      dropoff_lng: 106.7118,
      estimated_distance: 4.8,
      estimated_duration: 15,
      estimated_fare: 72000,
      actual_distance: null,
      actual_duration: null,
      actual_fare: null
    },
    {
      id: 'ride_req_006',
      customer_id: 'usr_cust_001',
      driver_id: null,
      vehicle_type: 'sedan',
      status: 'requested',
      pickup_address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM (IUH)',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_address: 'Đại học Bách Khoa TP.HCM, Quan 10, TP.HCM',
      dropoff_lat: 10.7725,
      dropoff_lng: 106.6578,
      estimated_distance: 8.0,
      estimated_duration: 25,
      estimated_fare: 111000,
      actual_distance: null,
      actual_duration: null,
      actual_fare: null
    }
  ];

  for (const r of rides) {
    await bookingClient.query(`
      INSERT INTO rides (
        id, customer_id, driver_id, vehicle_type, status,
        pickup_address, pickup_lat, pickup_lng,
        dropoff_address, dropoff_lat, dropoff_lng,
        estimated_distance, estimated_duration, estimated_fare,
        actual_distance, actual_duration, actual_fare
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        driver_id = EXCLUDED.driver_id,
        status = EXCLUDED.status,
        estimated_fare = EXCLUDED.estimated_fare,
        actual_fare = EXCLUDED.actual_fare;
    `, [
      r.id, r.customer_id, r.driver_id, r.vehicle_type, r.status,
      r.pickup_address, r.pickup_lat, r.pickup_lng,
      r.dropoff_address, r.dropoff_lat, r.dropoff_lng,
      r.estimated_distance, r.estimated_duration, r.estimated_fare,
      r.actual_distance, r.actual_duration, r.actual_fare
    ]);
  }
  console.log(`✅ booking_db.rides: Seeded ${rides.length} bookings for Customer usr_cust_001 (Meeting STT 14 requirement: >= 5 bookings).`);

  // Ride offers
  await bookingClient.query(`
    INSERT INTO ride_offers (id, ride_id, driver_id, status, expires_at)
    VALUES 
      ('offer_001', 'ride_asgn_004', 'DRV_003', 'accepted', NOW() + INTERVAL '10 minutes'),
      ('offer_002', 'ride_req_006', 'DRV_001', 'pending', NOW() + INTERVAL '2 minutes')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ booking_db.ride_offers: Seeded ride offers.');
  await bookingClient.end();

  // 3. SEED payment_db
  console.log('--- Seeding payment_db ---');
  const paymentClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'apple',
    password: process.env.PG_PASSWORD,
    database: 'payment_db'
  });
  await paymentClient.connect();

  // Pricing configs
  await paymentClient.query(`
    INSERT INTO pricing_configs (vehicle_type, base_fare, price_per_km, price_per_min)
    VALUES 
      ('sedan', 15000, 12000, 1000),
      ('suv', 20000, 15000, 1200),
      ('van', 30000, 18000, 1500)
    ON CONFLICT (vehicle_type) DO UPDATE SET
      base_fare = EXCLUDED.base_fare,
      price_per_km = EXCLUDED.price_per_km,
      price_per_min = EXCLUDED.price_per_min;
  `);
  console.log('✅ payment_db.pricing_configs: Seeded sedan, suv, van rates.');

  // Payments (STT 19: Online payments)
  const payments = [
    {
      id: 'pay_001',
      ride_id: 'ride_comp_001',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_001',
      amount: 89000,
      method: 'online_vnpay',
      status: 'COMPLETED',
      transaction_id: 'VNPAY_TXN_987654321',
      paid_at: new Date()
    },
    {
      id: 'pay_002',
      ride_id: 'ride_comp_002',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_002',
      amount: 167000,
      method: 'online_momo',
      status: 'COMPLETED',
      transaction_id: 'MOMO_TXN_888999777',
      paid_at: new Date()
    },
    {
      id: 'pay_003',
      ride_id: 'ride_prog_003',
      customer_id: 'usr_cust_001',
      driver_id: 'DRV_004',
      amount: 183000,
      method: 'credit_card',
      status: 'PENDING',
      transaction_id: null,
      paid_at: null
    }
  ];

  for (const p of payments) {
    await paymentClient.query(`
      INSERT INTO payments (id, ride_id, customer_id, driver_id, amount, method, status, transaction_id, paid_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (ride_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        status = EXCLUDED.status,
        transaction_id = EXCLUDED.transaction_id,
        paid_at = EXCLUDED.paid_at;
    `, [p.id, p.ride_id, p.customer_id, p.driver_id, p.amount, p.method, p.status, p.transaction_id, p.paid_at]);
  }
  console.log(`✅ payment_db.payments: Seeded ${payments.length} payment records.`);

  // Idempotency records (STT 30: Replay Attack test)
  await paymentClient.query(`
    INSERT INTO idempotency_records (idempotency_key, user_id, request_hash, response_payload, status_code)
    VALUES (
      'IDEMP_KEY_USR123_PAY_50000',
      'usr_cust_001',
      'hash_payload_usr123_amount50000_cab2026',
      '{"success":true,"message":"Payment processed successfully","paymentId":"pay_001","status":"COMPLETED","amount":89000}',
      200
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  `);
  console.log('✅ payment_db.idempotency_records: Seeded idempotency record for Replay Attack validation (STT 30).');
  await paymentClient.end();

  // 4. audit_db (audit-service - PostgreSQL)
  console.log('--- Seeding audit_db (PostgreSQL) ---');
  const auditClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'apple',
    password: process.env.PG_PASSWORD,
    database: 'audit_db'
  });
  await auditClient.connect();

  const centralLogs = [
    {
      id: 'aud_seed_001',
      action: 'APPROVE_DRIVER',
      resource: 'drivers/DRV_001',
      actor_id: 'usr_admin_001',
      actor_role: 'admin',
      details: { target: 'DRV_001', status: 'APPROVED' },
      ip_address: '127.0.0.1',
      status: 'SUCCESS'
    },
    {
      id: 'aud_seed_002',
      action: 'PAYMENT_CHECKOUT',
      resource: 'payments/checkout',
      actor_id: 'usr_cust_001',
      actor_role: 'customer',
      details: { rideId: 'ride_demo_001', amount: 85000 },
      ip_address: '127.0.0.1',
      status: 'SUCCESS'
    }
  ];

  for (const cl of centralLogs) {
    await auditClient.query(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, resource, ip_address, status, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [cl.id, cl.actor_id, cl.actor_role, cl.action, cl.resource, cl.ip_address, cl.status, JSON.stringify(cl.details)]);
  }
  console.log(`✅ audit_db.audit_logs: Seeded ${centralLogs.length} audit records into PostgreSQL.`);

  await auditClient.query(`
    INSERT INTO security_events (id, event_type, severity, source, ip_address, details, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;
  `, [
    'sec_seed_001',
    'SQLI_ATTEMPT_BLOCKED',
    'CRITICAL',
    'POST /auth/login',
    '192.168.1.100',
    JSON.stringify({ payload: "' OR 1=1 --", result: '401_UNAUTHORIZED' })
  ]);
  console.log('✅ audit_db.security_events: Seeded security attack event log into PostgreSQL.');
  await auditClient.end();
}

async function seedMongo() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  console.log(`\n🚀 [MONGODB] Starting MongoDB Seeding on ${mongoUri}...`);
  const client = new MongoClient(mongoUri);
  await client.connect();

  // 1. customer_db
  console.log('--- Seeding customer_db ---');
  const customerDb = client.db('customer_db');
  const customersCol = customerDb.collection('customers');
  await customersCol.createIndex({ uid: 1 }, { unique: true });

  const customers = [
    {
      uid: 'usr_cust_001',
      fullname: 'Nguyen Van An',
      age: 28,
      address: '12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      uid: 'usr_cust_002',
      fullname: 'Tran Thi Bich',
      age: 24,
      address: '45 Le Loi, Ben Nghe, Quan 1, TP.HCM',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      uid: 'usr_cust_003',
      fullname: 'Le Hoang Cuong',
      age: 32,
      address: '128 Phan Dang Luu, Phuong 3, Phu Nhuan, TP.HCM',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      uid: 'usr_cust_004',
      fullname: 'Pham Thi Dung',
      age: 29,
      address: '88 Nguyen Hue, Ben Nghe, Quan 1, TP.HCM',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      uid: 'usr_cust_005',
      fullname: 'Vu Tuan Em',
      age: 22,
      address: '56 Quang Trung, Phuong 10, Go Vap, TP.HCM',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const c of customers) {
    await customersCol.updateOne({ uid: c.uid }, { $set: c }, { upsert: true });
  }
  console.log(`✅ customer_db.customers: Seeded ${customers.length} customers.`);

  // 2. driver_db
  console.log('--- Seeding driver_db ---');
  const driverDb = client.db('driver_db');
  const driversCol = driverDb.collection('drivers');
  await driversCol.createIndex({ 'location.coordinates': '2dsphere' });
  await driversCol.createIndex({ status: 1 });
  await driversCol.createIndex({ uid: 1 }, { unique: true });

  // Smoke test STT 13: Cần giả lập có sẵn ít nhất 5 tài xế có các trạng thái khác nhau
  // Toạ độ IUH: [106.6868, 10.8221]. Bán kính 1km xung quanh IUH.
  const drivers = [
    {
      uid: 'usr_drv_001',
      driverId: 'DRV_001',
      fullname: 'Nguyen Tuan Driver',
      phone: '0901234001',
      vehicleType: 'sedan',
      licensePlate: '59A-123.45',
      status: 'AVAILABLE',
      rating: 4.9,
      totalRides: 342,
      location: {
        type: 'Point',
        coordinates: [106.6872, 10.8225] // ~100m từ IUH
      },
      updatedAt: new Date()
    },
    {
      uid: 'usr_drv_002',
      driverId: 'DRV_002',
      fullname: 'Tran Nam Driver',
      phone: '0901234002',
      vehicleType: 'suv',
      licensePlate: '59A-678.90',
      status: 'AVAILABLE',
      rating: 4.8,
      totalRides: 215,
      location: {
        type: 'Point',
        coordinates: [106.6850, 10.8210] // ~300m từ IUH
      },
      updatedAt: new Date()
    },
    {
      uid: 'usr_drv_003',
      driverId: 'DRV_003',
      fullname: 'Le Hai Driver',
      phone: '0901234003',
      vehicleType: 'sedan',
      licensePlate: '59B-234.56',
      status: 'BUSY',
      rating: 4.7,
      totalRides: 189,
      location: {
        type: 'Point',
        coordinates: [106.6890, 10.8240] // ~500m từ IUH
      },
      updatedAt: new Date()
    },
    {
      uid: 'usr_drv_004',
      driverId: 'DRV_004',
      fullname: 'Pham Minh Driver',
      phone: '0901234004',
      vehicleType: 'van',
      licensePlate: '59C-345.67',
      status: 'ON_TRIP',
      rating: 5.0,
      totalRides: 512,
      location: {
        type: 'Point',
        coordinates: [106.6830, 10.8200] // ~700m từ IUH
      },
      updatedAt: new Date()
    },
    {
      uid: 'usr_drv_005',
      driverId: 'DRV_005',
      fullname: 'Hoang Driver',
      phone: '0901234005',
      vehicleType: 'sedan',
      licensePlate: '59A-999.88',
      status: 'OFFLINE',
      rating: 4.6,
      totalRides: 98,
      location: {
        type: 'Point',
        coordinates: [106.6900, 10.8250] // ~900m từ IUH
      },
      updatedAt: new Date()
    },
    {
      uid: 'usr_drv_006',
      driverId: 'DRV_006',
      fullname: 'Vu Pending Driver',
      phone: '0901234006',
      vehicleType: 'sedan',
      licensePlate: '59D-111.22',
      status: 'PENDING_APPROVAL',
      rating: 0,
      totalRides: 0,
      location: {
        type: 'Point',
        coordinates: [106.6868, 10.8221]
      },
      updatedAt: new Date()
    }
  ];

  for (const d of drivers) {
    await driversCol.updateOne({ uid: d.uid }, { $set: d }, { upsert: true });
  }
  console.log(`✅ driver_db.drivers: Seeded ${drivers.length} drivers with different statuses (AVAILABLE, BUSY, ON_TRIP, OFFLINE, PENDING_APPROVAL).`);

  // Ratings collection (STT 20: Đánh giá chuyến đi)
  const ratingsCol = driverDb.collection('ratings');
  await ratingsCol.createIndex({ rideId: 1 }, { unique: true });
  const ratings = [
    {
      rideId: 'ride_comp_001',
      customerId: 'usr_cust_001',
      driverId: 'DRV_001',
      stars: 5,
      comment: 'Tài xế lái xe rất êm ái, đón đúng giờ tại cổng IUH!',
      createdAt: new Date()
    },
    {
      rideId: 'ride_comp_002',
      customerId: 'usr_cust_001',
      driverId: 'DRV_002',
      stars: 5,
      comment: 'Xe SUV sạch sẽ, thái độ phục vụ thân thiện, 5 sao.',
      createdAt: new Date()
    },
    {
      rideId: 'ride_comp_003',
      customerId: 'usr_cust_002',
      driverId: 'DRV_003',
      stars: 4,
      comment: 'Phục vụ tốt, chỉ có điều đoạn đường đông kẹt xe một chút.',
      createdAt: new Date()
    }
  ];

  for (const r of ratings) {
    await ratingsCol.updateOne({ rideId: r.rideId }, { $set: r }, { upsert: true });
  }
  console.log(`✅ driver_db.ratings: Seeded ${ratings.length} reviews & ratings linked to rides.`);

  // 3. notification_db
  console.log('--- Seeding notification_db ---');
  const notifDb = client.db('notification_db');
  const notifCol = notifDb.collection('notifications');
  const notifs = [
    {
      userId: 'usr_cust_001',
      title: 'Tài xế đã nhận chuyến',
      message: 'Tài xế Nguyễn Tuấn (59A-123.45) đang đến đón bạn tại 12 Nguyễn Văn Bảo.',
      type: 'RIDE_ASSIGNED',
      isRead: true,
      createdAt: new Date()
    },
    {
      userId: 'usr_cust_001',
      title: 'Chuyến đi hoàn thành',
      message: 'Chuyến đi đến Sân bay Tân Sơn Nhất đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ!',
      type: 'RIDE_COMPLETED',
      isRead: true,
      createdAt: new Date()
    },
    {
      userId: 'usr_cust_001',
      title: 'Thanh toán thành công',
      message: 'Bạn đã thanh toán 89,000 VND qua cổng VNPay thành công.',
      type: 'PAYMENT_SUCCESS',
      isRead: false,
      createdAt: new Date()
    }
  ];

  for (const n of notifs) {
    await notifCol.insertOne(n);
  }
  console.log(`✅ notification_db.notifications: Seeded ${notifs.length} notifications.`);

  // 4. admin_db
  console.log('--- Seeding admin_db ---');
  const adminDb = client.db('admin_db');
  const auditCol = adminDb.collection('audit_logs');
  const logs = [
    {
      action: 'APPROVE_DRIVER',
      adminId: 'usr_admin_001',
      adminUsername: 'admin_hung',
      target: 'DRV_001',
      details: 'Approved driver license and background check for Nguyen Tuan Driver.',
      timestamp: new Date()
    },
    {
      action: 'UPDATE_PRICING_CONFIG',
      adminId: 'usr_admin_001',
      adminUsername: 'admin_hung',
      target: 'pricing_configs',
      details: 'Updated base fare for sedan to 15,000 VND and SUV to 20,000 VND.',
      timestamp: new Date()
    }
  ];

  for (const l of logs) {
    await auditCol.insertOne(l);
  }
  console.log(`✅ admin_db.audit_logs: Seeded ${logs.length} audit logs.`);

  // 5. trip_db (trip-service)
  console.log('--- Seeding trip_db ---');
  const tripDb = client.db('trip_db');
  const tripsCol = tripDb.collection('trips');
  await tripsCol.deleteMany({});
  const sampleTrips = [
    {
      tripId: 'trip_demo_001',
      bookingId: 'ride_demo_001',
      customerId: 'usr_cust_001',
      driverId: 'DRV_001',
      vehicleType: 'sedan',
      status: 'IN_PROGRESS',
      pickupAddress: '12 Nguyen Van Bao, Go Vap, TP.HCM',
      pickupLocation: { type: 'Point', coordinates: [106.6868, 10.8221] },
      dropoffAddress: 'Tan Son Nhat Airport, TP.HCM',
      dropoffLocation: { type: 'Point', coordinates: [106.6588, 10.8184] },
      currentLocation: { lat: 10.8210, lng: 106.6800, speed: 35, bearing: 240 },
      estimatedDistance: 6.2,
      estimatedDuration: 18,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tripId: 'trip_comp_001',
      bookingId: 'ride_comp_001',
      customerId: 'usr_cust_001',
      driverId: 'DRV_001',
      vehicleType: 'sedan',
      status: 'COMPLETED',
      pickupAddress: '12 Nguyen Van Bao, Go Vap',
      dropoffAddress: 'Tan Son Nhat Airport',
      currentLocation: { lat: 10.8184, lng: 106.6588 },
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  for (const t of sampleTrips) {
    await tripsCol.insertOne(t);
  }
  console.log(`✅ trip_db.trips: Seeded ${sampleTrips.length} active/completed trips.`);

  const tripLocCol = tripDb.collection('trip_locations');
  await tripLocCol.deleteMany({});
  await tripLocCol.insertOne({
    tripId: 'trip_demo_001',
    location: { type: 'Point', coordinates: [106.6868, 10.8221] },
    lat: 10.8221,
    lng: 106.6868,
    speed: 30,
    bearing: 180,
    recordedAt: new Date()
  });
  console.log('✅ trip_db.trip_locations: Seeded initial GPS tracking breadcrumb.');

  await client.close();
}

async function main() {
  try {
    await seedPostgres();
    await seedMongo();
    console.log('\n🎉 ====================================================');
    console.log('🎉 ALL DATABASES SEEDED SUCCESSFULLY ACCORDING TO PHIEUCHAM.MD!');
    console.log('🎉 ====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

main();
