const NotificationModel = require('../models/notificationModel');
const { sendError } = require('@cab/shared-config');

const notificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.query.userId || req.headers['x-user-id'] || 'usr_cust_001';
      const limit = parseInt(req.query.limit, 10) || 20;

      const notifications = await NotificationModel.findByUserId(userId, limit);
      return res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications
      });
    } catch (err) {
      console.error('[NOTIFICATION_CONTROLLER] getNotifications error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  }
};

module.exports = notificationController;
