const { MongoClient } = require('mongodb');
const config = require('./env');

let dbClient = null;
let tripDb = null;

async function connectDB() {
  if (tripDb) return tripDb;
  try {
    dbClient = new MongoClient(config.mongoUri);
    await dbClient.connect();
    tripDb = dbClient.db(config.dbName);
    console.log(`[TRIP_DB] Connected successfully to MongoDB ${config.dbName}`);

    // Create indexes for trips and locations
    const tripsCol = tripDb.collection('trips');
    await tripsCol.createIndex({ tripId: 1 }, { unique: true });
    await tripsCol.createIndex({ bookingId: 1 });
    await tripsCol.createIndex({ customerId: 1 });
    await tripsCol.createIndex({ driverId: 1 });
    await tripsCol.createIndex({ status: 1 });

    const locationsCol = tripDb.collection('trip_locations');
    await locationsCol.createIndex({ tripId: 1, recordedAt: -1 });

    return tripDb;
  } catch (err) {
    console.error('[TRIP_DB] Connection error:', err.message);
    throw err;
  }
}

function getTripsCollection() {
  if (!tripDb) throw new Error('Database not connected. Please call connectDB() first.');
  return tripDb.collection('trips');
}

function getTripLocationsCollection() {
  if (!tripDb) throw new Error('Database not connected. Please call connectDB() first.');
  return tripDb.collection('trip_locations');
}

module.exports = {
  connectDB,
  getTripsCollection,
  getTripLocationsCollection
};
