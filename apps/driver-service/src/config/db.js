const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/driver_db';

let dbClient = null;
let driverDb = null;

async function connectDB() {
  if (driverDb) return driverDb;
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    driverDb = dbClient.db('driver_db');
    console.log('[DRIVER_DB] Connected successfully to MongoDB driver_db');

    // Khởi tạo index không gian và unique
    const driversCol = driverDb.collection('drivers');
    await driversCol.createIndex({ 'location.coordinates': '2dsphere' });
    await driversCol.createIndex({ status: 1 });
    await driversCol.createIndex({ uid: 1 }, { unique: true });

    const ratingsCol = driverDb.collection('ratings');
    await ratingsCol.createIndex({ rideId: 1 }, { unique: true });

    return driverDb;
  } catch (err) {
    console.error('[DRIVER_DB] Connection error:', err.message);
    throw err;
  }
}

function getDb() {
  if (!driverDb) {
    throw new Error('Database not connected. Please call connectDB() first.');
  }
  return driverDb;
}

function getDriversCollection() {
  return getDb().collection('drivers');
}

function getRatingsCollection() {
  return getDb().collection('ratings');
}

module.exports = {
  connectDB,
  getDb,
  getDriversCollection,
  getRatingsCollection
};
