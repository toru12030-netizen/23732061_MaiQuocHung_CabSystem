const { getNotificationsCollection } = require('../config/db');

const NotificationModel = {
  async createNotification({ userId, title, message, type, data = {} }) {
    const col = getNotificationsCollection();
    const doc = {
      userId,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date()
    };
    const res = await col.insertOne(doc);
    return { _id: res.insertedId, ...doc };
  },

  async findByUserId(userId, limit = 20) {
    const col = getNotificationsCollection();
    return col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  }
};

module.exports = NotificationModel;
