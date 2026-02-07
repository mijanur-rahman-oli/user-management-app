// IMPORTANT: Database configuration and connection pool setup
const { Pool } = require('pg');
require('dotenv').config();

// NOTE: Create PostgreSQL connection pool for efficient database access
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'user_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// NOTA BENE: Test database connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
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