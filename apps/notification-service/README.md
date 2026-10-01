# Notification Service

Consume integration events từ Kafka, tạo inbox/delivery record trong MongoDB `notification_db`, gửi email và đẩy realtime qua Socket.IO. Kafka là event broker; MongoDB lưu thông báo người dùng đọc được.
