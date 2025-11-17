// backend/config/db.js (Final Corrected Version)

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {};

if (process.env.DATABASE_URL) {
  // This part is for Render and is correct.
  console.log('Production environment detected. Using DATABASE_URL.');
  dbConfig.connectionString = process.env.DATABASE_URL;
  dbConfig.ssl = {
    rejectUnauthorized: false
  };

} else {
  // This part is for your local machine.
  console.log('Development environment detected. Using local DB credentials.');
  dbConfig.host = process.env.DB_HOST;
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
  
  // **THE FIX:** The variable name now correctly matches your .env file.
  dbConfig.database = process.env.DB_DATABASE; 
  
  dbConfig.port = process.env.DB_PORT;
}

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully!');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export default pool;