/**
 * Database Setup & Configuration Test
 * Run this script to verify database connection and setup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const log = (message, type = 'info') => {
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || type;
  console.log(`${prefix} ${message}`);
};

async function checkDatabaseConfig() {
  console.log('\n' + '═'.repeat(80));
  console.log('🗄️  BUY237 DATABASE CONFIGURATION TEST');
  console.log('═'.repeat(80) + '\n');

  // Check environment variables
  log('Checking environment variables...', 'info');
  
  const requiredVars = ['JWT_SECRET', 'NODE_ENV', 'PORT'];
  const databaseVars = process.env.DATABASE_URL 
    ? ['DATABASE_URL']
    : ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

  const missingVars = [];
  
  for (const varName of [...requiredVars, ...databaseVars]) {
    if (process.env[varName]) {
      log(`${varName} = ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : process.env[varName]}`, 'success');
    } else {
      log(`${varName} = NOT SET`, 'warning');
      missingVars.push(varName);
    }
  }

  console.log('\n');

  // Check .env file
  log('Checking .env file...', 'info');
  const envPath = path.join(__dirname, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    log(`.env file found at ${envPath}`, 'success');
  } else {
    log(`.env file NOT found at ${envPath}`, 'warning');
    log('You need to create .env file. Copy from .env.example and fill in values.', 'warning');
  }

  console.log('\n');

  // Try to connect to database
  log('Testing database connection...', 'info');
  try {
    const { query } = require('./src/db');
    const result = await query('SELECT NOW() as current_time;');
    log('Database connection successful!', 'success');
    log(`Current database time: ${result.rows[0].current_time}`, 'success');
  } catch (err) {
    log(`Database connection failed: ${err.message}`, 'error');
    log('This is expected if database is not set up yet.', 'warning');
  }

  console.log('\n');

  // Check schema.sql exists
  log('Checking schema.sql...', 'info');
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const stats = fs.statSync(schemaPath);
    log(`schema.sql found (${(stats.size / 1024).toFixed(2)} KB)`, 'success');
  } else {
    log('schema.sql NOT found', 'error');
  }

  console.log('\n');

  // Configuration summary
  console.log('═'.repeat(80));
  console.log('📊 CONFIGURATION SUMMARY');
  console.log('═'.repeat(80));

  console.log(`\n🔧 Current Configuration:`);
  console.log(`  ├─ Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  ├─ Backend Port: ${process.env.PORT || 5000}`);
  console.log(`  ├─ Database Type: ${process.env.DATABASE_URL ? 'Supabase/Remote' : 'Local PostgreSQL'}`);
  console.log(`  └─ JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);

  console.log(`\n📝 Next Steps:`);
  if (missingVars.length > 0) {
    console.log(`  1. ⚠️  Missing variables: ${missingVars.join(', ')}`);
    console.log(`  2. 📄 Edit backend/.env and add these values`);
    console.log(`  3. 🔄 Restart the backend server`);
  } else {
    console.log(`  1. ✅ All environment variables set`);
    console.log(`  2. 🗄️  Run database schema setup`);
    console.log(`  3. 🧪 Run tests: npm run test`);
  }

  console.log('\n📚 For detailed setup instructions, see DATABASE_SETUP.md');
  console.log('═'.repeat(80) + '\n');
}

// Run the check
checkDatabaseConfig().catch(err => {
  log(`Unexpected error: ${err.message}`, 'error');
  process.exit(1);
});
