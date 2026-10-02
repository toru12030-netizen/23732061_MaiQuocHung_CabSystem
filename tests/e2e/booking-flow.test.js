const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { apiClient } = require('../helpers/api-client');
const { loginCustomer } = require('../helpers/auth-helper');

describe('E2E Tests - Complete Booking Flow & Lifecycle (STT 15 - 20)', () => {
  let customerAuth;
  let activeBookingId;
  let activePaymentId;
  let activeTransactionId;

  before(async () => {
    customerAuth = await loginCustomer();
  });

  it('STT 15: Khách hàng đặt xe -> Tạo booking -> Trạng thái tìm tài xế', async () => {
    const payload = {
      customer_id: customerAuth.uid,
      pickup_address: '12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
      dropoff_address: 'Sân bay Quốc tế Tân Sơn Nhất, Tân Bình, TP.HCM',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_lat: 10.8184,
      dropoff_lng: 106.6588,
      vehicle_type: 'CAR_4_SEATS',
      fare_amount: 85000
    };

    const res = await apiClient.post('/bookings', payload, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 201, 'Đặt xe thành công phải trả về HTTP 201 Created');
    assert.strictEqual(res.data.success, true);
    
    // Lấy ID động từ response
    const booking = res.data.data?.booking || res.data.data;
    activeBookingId = booking.id;
    assert.ok(activeBookingId, 'Booking ID phải tồn tại trong response');
    assert.strictEqual(
      booking.status,
      'requested',
      'Trạng thái booking ban đầu phải là requested (đang tìm tài xế)'
    );
  });

  it('STT 16: Tài xế nhận chuyến xe (Assign Driver -> Accepted)', async () => {
    assert.ok(activeBookingId, 'Cần bookingId từ bước STT 15');

    const res = await apiClient.post(`/bookings/${activeBookingId}/accept`, {
      driver_id: 'DRV_001'
    }, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'Tài xế nhận chuyến phải trả về HTTP 200');
    assert.strictEqual(res.data.success, true);

    const booking = res.data.data?.booking || res.data.data;
    const status = (booking.status || '').toLowerCase();
    assert.ok(
      status === 'assigned' || status === 'accepted',
      `Trạng thái phải là assigned hoặc accepted, thực tế: ${status}`
    );
  });

  it('STT 17: Cập nhật trạng thái chuyến xe theo đúng trình tự nghiệp vụ', async () => {
    assert.ok(activeBookingId, 'Cần bookingId từ bước STT 15');

    // 17.1: Tài xế đến điểm đón (ARRIVED)
    const resArrived = await apiClient.put(`/bookings/${activeBookingId}/status`, {
      status: 'arrived'
    }, {
      headers: customerAuth.authHeader
    });
    assert.strictEqual(resArrived.status, 200, 'Bước 1: Chuyển trạng thái ARRIVED thành công');
    const sArrived = (resArrived.data.data?.status || resArrived.data.data?.booking?.status || '').toLowerCase();
    assert.ok(sArrived.includes('arrived'), `Trạng thái phải là arrived: ${sArrived}`);

    // 17.2: Bắt đầu di chuyển (IN_PROGRESS)
    const resInProgress = await apiClient.put(`/bookings/${activeBookingId}/status`, {
      status: 'in_progress'
    }, {
      headers: customerAuth.authHeader
    });
    assert.strictEqual(resInProgress.status, 200, 'Bước 2: Chuyển trạng thái IN_PROGRESS thành công');
    const sProgress = (resInProgress.data.data?.status || resInProgress.data.data?.booking?.status || '').toLowerCase();
    assert.ok(sProgress.includes('progress'), `Trạng thái phải là in_progress: ${sProgress}`);

    // 17.3: Hoàn thành chuyến đi (COMPLETED)
    const resCompleted = await apiClient.put(`/bookings/${activeBookingId}/status`, {
      status: 'completed'
    }, {
      headers: customerAuth.authHeader
    });
    assert.strictEqual(resCompleted.status, 200, 'Bước 3: Chuyển trạng thái COMPLETED thành công');
    const sCompleted = (resCompleted.data.data?.status || resCompleted.data.data?.booking?.status || '').toLowerCase();
    assert.ok(sCompleted.includes('completed'), `Trạng thái phải là completed: ${sCompleted}`);
  });

  it('STT 19: Thanh toán online cho chuyến xe (Checkout & Callback)', async () => {
    assert.ok(activeBookingId, 'Cần bookingId từ bước STT 15');

    // 19.1: Khởi tạo thanh toán online
    const checkoutRes = await apiClient.post('/payments/checkout', {
      ride_id: activeBookingId,
      amount: 85000,
      customer_id: customerAuth.uid,
      driver_id: 'DRV_001',
      method: 'online_banking'
    }, {
      headers: customerAuth.authHeader
    });

    assert.ok(
      checkoutRes.status === 200 || checkoutRes.status === 201,
      `Khởi tạo thanh toán trả về HTTP 200 hoặc 201 (Thực tế: ${checkoutRes.status})`
    );
    assert.strictEqual(checkoutRes.data.success, true);

    const paymentData = checkoutRes.data.data;
    activePaymentId = paymentData?.payment?.id || paymentData?.paymentId || `pay_${Date.now()}`;
    activeTransactionId = paymentData?.transactionId || `TXN_${Date.now()}`;

    // 19.2: Webhook callback ghi nhận thanh toán hoàn tất
    const callbackRes = await apiClient.post('/payments/callback', {
      payment_id: activePaymentId,
      transaction_id: activeTransactionId,
      status: 'COMPLETED'
    });

    assert.strictEqual(callbackRes.status, 200, 'Callback thanh toán trả về HTTP 200');
    assert.strictEqual(callbackRes.data.success, true);
    const cbStatus = callbackRes.data.data?.status || callbackRes.data.data?.payment?.status;
    assert.strictEqual(cbStatus, 'COMPLETED', 'Trạng thái thanh toán phải là COMPLETED');
  });

  it('STT 20: Đánh giá chuyến đi (Rating, số sao, nhận xét)', async () => {
    assert.ok(activeBookingId, 'Cần bookingId từ bước STT 15');

    const ratingRes = await apiClient.post(`/rides/${activeBookingId}/rating`, {
      ride_id: activeBookingId,
      driver_id: 'DRV_001',
      stars: 5,
      comment: 'Tài xế thân thiện, xe sạch sẽ, dịch vụ 5 sao'
    }, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(ratingRes.status, 201, 'Gửi đánh giá phải trả về HTTP 201 Created');
    assert.strictEqual(ratingRes.data.success, true);
    const ratingDoc = ratingRes.data.data;
    assert.strictEqual(ratingDoc.stars, 5, 'Số sao đánh giá phải là 5');
    assert.strictEqual(ratingDoc.rideId, activeBookingId, 'Đánh giá phải liên kết với mã chuyến đi');
  });

  it('STT 18: Hủy chuyến xe (Tạo booking mới -> Cung cấp lý do -> Xác nhận hủy CANCELED)', async () => {
    // 1. Tạo một booking mới riêng biệt để test hủy
    const newBookingRes = await apiClient.post('/bookings', {
      customer_id: customerAuth.uid,
      pickup_address: '12 Nguyễn Văn Bảo, Gò Vấp',
      dropoff_address: 'Sân bay Tân Sơn Nhất',
      pickup_lat: 10.8221,
      pickup_lng: 106.6868,
      dropoff_lat: 10.8184,
      dropoff_lng: 106.6588,
      vehicle_type: 'CAR_4_SEATS',
      fare_amount: 85000
    }, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(newBookingRes.status, 201);
    const cancelTargetId = newBookingRes.data.data?.booking?.id || newBookingRes.data.data?.id;
    assert.ok(cancelTargetId, 'Booking để hủy phải có ID');

    // 2. Khách hàng thực hiện hủy chuyến
    const cancelRes = await apiClient.post(`/bookings/${cancelTargetId}/cancel`, {
      reason: 'Khách hàng đổi ý, muốn đổi loại phương tiện'
    }, {
      headers: customerAuth.authHeader
    });

    assert.strictEqual(cancelRes.status, 200, 'Hủy chuyến xe thành công trả về HTTP 200');
    assert.strictEqual(cancelRes.data.success, true);

    const cancelledBooking = cancelRes.data.data?.booking || cancelRes.data.data;
    const cancelStatus = (cancelledBooking.status || '').toLowerCase();
    assert.ok(
      cancelStatus.includes('cancel'),
      `Trạng thái sau khi hủy phải là cancelled / CANCELED: ${cancelStatus}`
    );
  });

});
