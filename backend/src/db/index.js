const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'buy237_db',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
);

pool.on('error', (err) => console.error('DB pool error:', err));

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('DB query error:', err.message, '\nQuery:', text.substring(0, 100));
    throw err;
  }
};

module.exports = { query, pool };
