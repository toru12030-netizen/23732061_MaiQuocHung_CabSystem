const NotificationModel = require('../models/notificationModel');

const NotificationService = {
  async getUserNotifications(userId, limit = 20) {
    return NotificationModel.findByUserId(userId, limit);
  },

  async dispatchNotification(payload) {
    return NotificationModel.createNotification(payload);
  }
};

module.exports = NotificationService;
