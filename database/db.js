// IMPORTANT: Database configuration and connection pool setup
const { Pool } = require('pg');
require('dotenv').config();

// NOTE: Create PostgreSQL connection pool for efficient database access
// IMPORTANT: Support both DATABASE_URL (for Render/Heroku) and individual credentials
let poolConfig;

if (process.env.DATABASE_URL) {
  // Render/Heroku style connection string
  console.log('Using DATABASE_URL connection');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for managed databases
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  // Individual credentials (local development or fallback)
  console.log('Using individual database credentials');
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'user_management',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// NOTA BENE: Test database connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Test connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err.message);
  } else {
    console.log('Database connection test successful:', res.rows[0]);
  }
});

// IMPORTANT: Helper function to get unique ID value from database result
// This is a utility for extracting ID from INSERT RETURNING queries
function getUniqIdValue(result) {
  // NOTE: Returns the ID of the newly inserted or updated record
  if (result && result.rows && result.rows.length > 0) {
    return result.rows[0].id;
  }
  return null;
}

module.exports = {
  pool,
  getUniqIdValue,
  query: (text, params) => pool.query(text, params),
};