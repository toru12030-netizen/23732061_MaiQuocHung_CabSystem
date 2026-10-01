// Initialize cab-secure-db for sensitive PII
const secureDb = db.getSiblingDB('driver_secure_db');
secureDb.createCollection('driver_sensitive_records');
secureDb.driver_sensitive_records.createIndex({ driverId: 1 }, { unique: true });
secureDb.driver_sensitive_records.createIndex({ identityNumber: 1 }, { unique: true });

print("Secure DB initialization complete.");
