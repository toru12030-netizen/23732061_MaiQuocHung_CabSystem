const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/notification_db';

let dbClient = null;
let notifDb = null;

async function connectDB() {
  if (notifDb) return notifDb;
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    notifDb = dbClient.db('notification_db');
    console.log('[NOTIFICATION_DB] Connected successfully to MongoDB notification_db');
    return notifDb;
  } catch (err) {
    console.error('[NOTIFICATION_DB] Connection error:', err.message);
    throw err;
  }
}

function getNotificationsCollection() {
  if (!notifDb) throw new Error('Database not connected. Please call connectDB() first.');
  return notifDb.collection('notifications');
}

module.exports = {
  connectDB,
  getNotificationsCollection
};
