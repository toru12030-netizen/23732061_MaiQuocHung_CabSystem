// Initialize cab-app-db databases and collections
const appDbs = ['driver_db', 'customer_db', 'notification_db', 'admin_db'];

for (const dbName of appDbs) {
  const targetDb = db.getSiblingDB(dbName);
  print(`Initializing database: ${dbName}`);
  targetDb.createCollection('_init_placeholder');
  targetDb._init_placeholder.drop();
}

// customer_db setup
const customerDb = db.getSiblingDB('customer_db');
customerDb.createCollection('customers');
customerDb.customers.createIndex({ uid: 1 }, { unique: true });

// driver_db setup
const driverDb = db.getSiblingDB('driver_db');
driverDb.createCollection('drivers');
driverDb.drivers.createIndex({ 'location.coordinates': '2dsphere' });
driverDb.drivers.createIndex({ status: 1 });
driverDb.drivers.createIndex({ phone: 1 }, { unique: true });

driverDb.createCollection('ratings');
driverDb.ratings.createIndex({ driverId: 1 });
driverDb.ratings.createIndex({ rideId: 1 }, { unique: true });

// notification_db setup
const notifDb = db.getSiblingDB('notification_db');
notifDb.createCollection('notifications');
notifDb.notifications.createIndex({ userId: 1, createdAt: -1 });

// admin_db setup
const adminDb = db.getSiblingDB('admin_db');
adminDb.createCollection('audit_logs');
adminDb.audit_logs.createIndex({ timestamp: -1 });
adminDb.audit_logs.createIndex({ action: 1 });

print("App DB initialization complete.");
