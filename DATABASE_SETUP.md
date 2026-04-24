# 🗄️ Buy237 Database Setup Guide

## Overview

This guide walks you through setting up the Buy237 e-commerce platform database using **Supabase** (simplest) or a local PostgreSQL database.

## Table of Contents

1. [Option 1: Supabase Setup (Recommended)](#option-1-supabase-setup-recommended)
2. [Option 2: Local PostgreSQL Setup](#option-2-local-postgresql-setup)
3. [Running the Schema](#running-the-schema)
4. [Seeding Test Data](#seeding-test-data)
5. [Testing Database Connection](#testing-database-connection)
6. [Environment Variables](#environment-variables)

---

## Option 1: Supabase Setup (Recommended) ⭐

### Why Supabase?
- Free tier with 500MB database
- Built-in PostgreSQL
- Real-time subscriptions (if needed later)
- Easy SSL/TLS support
- Dashboard for database management

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Sign Up** and create an account (use GitHub or email)
3. Verify your email

### Step 2: Create a Project

1. From your Supabase dashboard, click **New Project**
2. Fill in the form:
   - **Name**: `buy237-db`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select closest to you (or US-East for default)
3. Click **Create new project** and wait 2-3 minutes for setup

### Step 3: Get Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Look for **Connection string** section
3. Select **URI** tab
4. You should see something like:
   ```
   postgresql://postgres:[PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres
   ```

5. Copy this full string and replace `[PASSWORD]` with the password you created

### Step 4: Update `.env` File

1. Open `backend/.env` in VS Code
2. Replace this line:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=buy237_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

3. With this:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT].supabase.co:5432/postgres
   ```

4. Example:
   ```
   DATABASE_URL=postgresql://postgres:MyStrongPassword123@abcdef12345.supabase.co:5432/postgres
   ```

5. Save the file (Ctrl+S)

### Step 5: Skip to [Running the Schema](#running-the-schema)

---

## Option 2: Local PostgreSQL Setup

### Step 1: Install PostgreSQL

**Windows:**
1. Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Set password for `postgres` user (remember this!)
   - Keep port as `5432`
4. Complete installation

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

Open terminal/PowerShell and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# In the psql prompt, create the database:
CREATE DATABASE buy237_db;
\q  # Exit psql
```

### Step 3: Update `.env` File

Your `.env` should already have:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buy237_db
DB_USER=postgres
DB_PASSWORD=postgres  # Change if you used different password
```

---

## Running the Schema

Now run the database schema to create all tables:

### Method 1: Using Node.js Script (Easiest)

1. In VS Code terminal, navigate to backend:
   ```bash
   cd backend
   ```

2. Create a setup script temporarily:
   ```bash
   node -e "
   const fs = require('fs');
   const { query } = require('./src/db');
   const schema = fs.readFileSync('./schema.sql', 'utf8');
   
   async function setup() {
     try {
       console.log('🔄 Running schema...');
       const statements = schema.split(';').filter(s => s.trim());
       for (const statement of statements) {
         if (statement.trim()) {
           await query(statement);
        }
      }
      console.log('✅ Database schema created successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  }
  
  setup();
   "
   ```

### Method 2: Using psql (Manual - Supabase Only)

1. Get your connection string from `.env`
2. Run:
   ```bash
   psql postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres < schema.sql
   ```

### Method 3: Using DBeaver (Visual - Any Database)

1. Download DBeaver from [https://dbeaver.io/download/](https://dbeaver.io/download/)
2. Create new connection to your database
3. Open `schema.sql` file and execute

---

## Seeding Test Data

After schema is created, seed test data:

```bash
cd backend
npm run seed
```

This creates:
- ✅ Sample categories
- ✅ Sample products
- ✅ Sample users
- ✅ Sample vendors

### Automated Setup

If you want to run schema creation and seeding in one step, use:

```bash
cd backend
npm run db:setup
```

This command applies the schema from `schema.sql` and then runs the seed script automatically.

---

## Testing Database Connection

### Quick Test

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. In another terminal, run:
   ```bash
   curl http://localhost:5000/health
   ```

3. You should see:
   ```json
   {
     "status": "OK",
     "service": "Buy237 API",
     "version": "1.0.0",
     "time": "2026-04-23T...",
     "env": "development"
   }
   ```

### Run API Tests

```bash
cd backend
node tests/apiTests.js
```

You should now see:
- ✅ More endpoints responding correctly
- ✅ Database queries working
- ✅ Higher success rate (aim for 80%+)

---

## Troubleshooting

### Error: `connect ECONNREFUSED 127.0.0.1:5432`

**Problem**: Database connection failed
**Solution**:
- Check PostgreSQL is running (local setup)
- Verify DATABASE_URL is correct (Supabase setup)
- Make sure `.env` file has correct credentials

### Error: `relation "users" does not exist`

**Problem**: Schema hasn't been created
**Solution**:
- Run the schema again (see "Running the Schema")
- Check for errors in the output

### Error: `SSL: CERTIFICATE_VERIFY_FAILED` (Supabase)

**Problem**: SSL certificate issue
**Solution**:
- Make sure you're using latest psql version
- Try with `?sslmode=disable` in connection string (development only)

### Still getting 500 errors?

**Debug steps**:
1. Check backend console output for error messages
2. Verify `.env` file is in `backend/` directory
3. Make sure all environment variables are set
4. Try restarting the backend: `Ctrl+C` then `npm run dev`

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Supabase connection | `postgresql://postgres:pass@...` |
| `DB_HOST` | Local DB host | `localhost` |
| `DB_PORT` | Local DB port | `5432` |
| `DB_NAME` | Database name | `buy237_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `mypassword` |
| `JWT_SECRET` | Token signing key | `your_secret_key` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Backend port | `5000` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |

---

## Next Steps

After successful database setup:

1. ✅ Run tests again
2. ✅ Browse frontend at http://localhost:3000
3. ✅ Test user registration & login
4. ✅ Test product browsing
5. ✅ Configure payment gateways (optional)
6. ✅ Set up email service (optional)

---

## Support

If you encounter issues:

1. Check error messages in backend console
2. Verify `.env` file is correct
3. Try restarting backend: `npm run dev`
4. Check Supabase dashboard (if using Supabase)
5. Review this guide for your specific setup

---

**Status**: 🟡 Database configuration step-by-step  
**Last Updated**: April 23, 2026
