require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const schemaPath = path.join(__dirname, '..', 'schema.sql');
const seedScriptPath = path.join(__dirname, '..', 'src', 'utils', 'seed.js');

const getPoolConfig = () => {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql://')) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'buy237_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
};

const loadSchema = () => {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }
  return fs.readFileSync(schemaPath, 'utf-8');
};

const run = async () => {
  console.log('\n🚀 Buy237 DB Setup Script');
  console.log('========================================');

  const poolConfig = getPoolConfig();
  const pool = new Pool(poolConfig);

  try {
    const schemaSql = loadSchema();
    console.log('📄 Applying schema to the database...');

    const client = await pool.connect();
    try {
      await client.query(schemaSql);
      console.log('✅ Schema applied successfully.');
    } finally {
      client.release();
    }

    if (!fs.existsSync(seedScriptPath)) {
      throw new Error(`Seed script not found at ${seedScriptPath}`);
    }

    console.log('🌱 Running seed script...');
    require(seedScriptPath);
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
