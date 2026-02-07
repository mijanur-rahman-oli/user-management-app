-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'unverified' CHECK (status IN ('unverified', 'active', 'blocked')),
    last_login_time TIMESTAMP,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create index on last_login_time for sorting (REQUIREMENT #3)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_time);

-- Create verification tokens table for email verification
CREATE TABLE IF NOT EXISTS verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);