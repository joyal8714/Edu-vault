// backend/config/db.js (Final Production-Ready Version)

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// Make sure to load environment variables at the top
dotenv.config();

// This is the configuration object that we will build.
const dbConfig = {};

// --- THIS IS THE CRITICAL LOGIC ---
// Check if the DATABASE_URL environment variable is available.
// Render automatically provides this variable for your hosted database.
if (process.env.DATABASE_URL) {
  
  // If we are on Render (or any platform that provides a DATABASE_URL)...
  console.log('Production environment detected. Using DATABASE_URL.');
  dbConfig.connectionString = process.env.DATABASE_URL;
  
  // Add SSL configuration. Render requires secure connections.
  dbConfig.ssl = {
    rejectUnauthorized: false
  };

} else {

  // If we are on your local machine (no DATABASE_URL)...
  console.log('Development environment detected. Using local DB credentials from .env file.');
  dbConfig.host = process.env.DB_HOST;
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
  dbConfig.database = process.env.DB_NAME; // Note: you used DB_NAME in your screenshot
  dbConfig.port = process.env.DB_PORT;
}

// Create the connection pool with the correct configuration
const pool = new Pool(dbConfig);

// Optional: Add listeners to confirm connection or catch errors
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully!');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export default pool;