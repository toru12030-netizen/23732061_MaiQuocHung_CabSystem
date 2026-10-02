const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.CUSTOMER_DB_NAME || 'customer_db';

let dbClient = null;
let customerCollection = null;

async function connectDb() {
  if (customerCollection) return customerCollection;

  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    const db = dbClient.db(DB_NAME);
    customerCollection = db.collection('customers');

    // Tạo Index: uid duy nhất
    await customerCollection.createIndex({ uid: 1 }, { unique: true });
    console.log(`[CUSTOMER_DB] Connected to MongoDB database '${DB_NAME}'`);
    return customerCollection;
  } catch (error) {
    console.error('[CUSTOMER_DB] MongoDB connection error:', error.message);
    throw error;
  }
}

function getCollection() {
  if (!customerCollection) {
    throw new Error('Database not initialized. Call connectDb() first.');
  }
  return customerCollection;
}

module.exports = {
  connectDb,
  getCollection
};
