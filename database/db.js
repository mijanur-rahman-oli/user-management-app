// IMPORTANT: Database configuration and connection pool setup
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
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