const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/admin_db';

let dbClient = null;
let adminDb = null;

async function connectDB() {
  if (adminDb) return adminDb;
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    adminDb = dbClient.db('admin_db');
    console.log('[ADMIN_DB] Connected successfully to MongoDB admin_db');
    return adminDb;
  } catch (err) {
    console.error('[ADMIN_DB] Connection error:', err.message);
    throw err;
  }
}

function getAuditLogsCollection() {
  if (!adminDb) throw new Error('Database not connected. Please call connectDB() first.');
  return adminDb.collection('audit_logs');
}

module.exports = {
  connectDB,
  getAuditLogsCollection
};
