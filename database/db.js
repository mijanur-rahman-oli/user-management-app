const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Use the connection string if available, otherwise use individual parts
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  // IMPORTANT: Enable SSL for any non-local connection
  // rejectUnauthorized: false is required for Render's self-signed certificates
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getUniqIdValue: (result) => (result?.rows?.[0]?.id || null),
};