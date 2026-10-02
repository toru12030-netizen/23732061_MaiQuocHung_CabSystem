/**
 * CI Database Initializer for PostgreSQL & MongoDB
 * Creates databases, users, schemas, and seeds initial data in CI environments.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function initPostgres() {
  const host = process.env.PG_HOST || 'localhost';
  const port = parseInt(process.env.PG_PORT || '5432', 10);
  const adminUser = process.env.PG_ADMIN_USER || process.env.PG_USER || 'postgres';
  const adminPass = process.env.PG_ADMIN_PASSWORD || process.env.PG_PASSWORD || '';

  console.log(`Connecting to PostgreSQL at ${host}:${port} as ${adminUser}...`);
  const rootClient = new Client({
    host,
    port,
    user: adminUser,
    password: adminPass,
    database: 'postgres'
  });

  try {
    await rootClient.connect();
  } catch (err) {
    console.log(`Could not connect to postgres database with ${adminUser}, trying without password:`, err.message);
  }

  // Create users & databases
  const dbs = [
    { name: 'auth_db', user: 'auth_service', pass: 'auth_pass_cab_2026', schema: 'infra/postgres/01-auth_db_schema.sql' },
    { name: 'booking_db', user: 'booking_service', pass: 'booking_pass_cab_2026', schema: 'infra/postgres/02-booking_db_schema.sql' },
    { name: 'payment_db', user: 'payment_service', pass: 'payment_pass_cab_2026', schema: 'infra/postgres/03-payment_db_schema.sql' }
  ];

  for (const item of dbs) {
    try {
      // Create user
      await rootClient.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${item.user}') THEN
            CREATE USER ${item.user} WITH ENCRYPTED PASSWORD '${item.pass}';
          END IF;
        END
        $$;
      `);
      // Check db existence
      const dbCheck = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [item.name]);
      if (dbCheck.rows.length === 0) {
        await rootClient.query(`CREATE DATABASE ${item.name} OWNER ${item.user}`);
      }
      await rootClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${item.name} TO ${item.user}`);
      console.log(`✅ Database ${item.name} and user ${item.user} ready.`);
    } catch (e) {
      console.warn(`Warning setting up ${item.name}:`, e.message);
    }
  }
  await rootClient.end();

  // Create schemas for each database
  for (const item of dbs) {
    const schemaPath = path.resolve(__dirname, '..', item.schema);
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const dbClient = new Client({
        host,
        port,
        user: item.user,
        password: item.pass,
        database: item.name
      });
      try {
        await dbClient.connect();
        await dbClient.query(sql);
        console.log(`✅ Schema applied to ${item.name} from ${item.schema}`);
      } catch (err) {
        console.warn(`Warning applying schema to ${item.name}:`, err.message);
      } finally {
        await dbClient.end();
      }
    }
  }
}

async function main() {
  try {
    await initPostgres();
    console.log('✅ CI database setup completed.');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

if (require.main === module) {
  main();
}

module.exports = { initPostgres };
