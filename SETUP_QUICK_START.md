# 🚀 Buy237 Quick Setup Reference

## Current Status ✅

```
✅ Backend server running on port 5000
✅ Frontend running on port 3000  
✅ .env configuration file created
⚠️  Database NOT connected yet
⚠️  Tests show 41% success rate (waiting for DB)
```

## Database Setup Options

### ⭐ **Option A: Supabase (Recommended for Cloud)**

1. **Create Account**: Go to https://supabase.com → Sign Up
2. **Create Project**: Click "New Project" in dashboard
3. **Get Connection String**:
   - Go to **Settings** → **Database**
   - Copy the **URI** connection string
   - Should look like: `postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres`

4. **Update .env**:
   ```bash
   # In backend/.env, replace these lines:
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=buy237_db
   # DB_USER=postgres
   # DB_PASSWORD=postgres
   
   # With this single line:
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@PROJECT_ID.supabase.co:5432/postgres
   ```

5. **Restart Backend**: Press Ctrl+C in backend terminal, then `npm run dev`

### 🖥️ **Option B: Local PostgreSQL**

1. **Install PostgreSQL**:
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql@15`
   - Linux: `sudo apt install postgresql`

2. **Create Database**:
   ```bash
   psql -U postgres
   CREATE DATABASE buy237_db;
   \q
   ```

3. **Your .env is already configured** (uses defaults)

4. **Restart Backend**: Press Ctrl+C, then `npm run dev`

---

## Running Database Schema

After configuring .env:

```bash
# In a terminal, from backend directory:
cd backend

# Option 1: Run schema via Node (Easiest)
node -e "const {exec} = require('child_process'); exec('psql -U postgres -h localhost -d buy237_db -f schema.sql', (e) => console.log(e ? 'Error: '+ e : 'Schema loaded!'))"

# Option 2: Direct psql (if using local PostgreSQL)
psql -U postgres -h localhost -d buy237_db -f schema.sql

# Option 3: Seed test data
npm run seed
```

---

## Verify Setup

### Check Configuration:
```bash
cd backend
node tests/checkDatabaseConfig.js
```

### Run API Tests:
```bash
cd backend
node tests/apiTests.js
```

Expected result: **80%+ success rate** (vs current 41%)

### Check Health:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "service": "Buy237 API",
  "version": "1.0.0"
}
```

---

## Environment Variables Needed

| Variable | Current | Needed? |
|----------|---------|---------|
| `DATABASE_URL` | Not set | **YES** (for Supabase)|
| `DB_HOST` | localhost | ✅ Set |
| `DB_PORT` | 5432 | ✅ Set |
| `DB_NAME` | buy237_db | ✅ Set |
| `DB_USER` | postgres | ✅ Set |
| `DB_PASSWORD` | postgres | ✅ Set |
| `JWT_SECRET` | ***secret*** | ✅ Set |
| `NODE_ENV` | development | ✅ Set |
| `PORT` | 5000 | ✅ Set |

---

## Troubleshooting

### "Database connection refused"
```
Solution: Check PostgreSQL is running and .env credentials are correct
```

### "relation 'users' does not exist"  
```
Solution: Run schema.sql: npm run seed (or manual schema command above)
```

### "500 errors on API endpoints"
```
1. Check backend console for error messages
2. Verify .env file exists in backend/ directory
3. Restart backend: Ctrl+C then npm run dev
```

---

## Files Created for Setup

✅ `backend/.env` - Your configuration file  
✅ `backend/.env.example` - Template with all options  
✅ `DATABASE_SETUP.md` - Detailed setup guide  
✅ `backend/tests/checkDatabaseConfig.js` - Configuration test  
✅ `backend/tests/apiTests.js` - API endpoint tests  
✅ `frontend/tests/componentTests.js` - Frontend tests  

---

## Quick Start Checklist

- [ ] Choose database (Supabase or Local PostgreSQL)
- [ ] Create database account/project
- [ ] Update `backend/.env` with database URL/credentials
- [ ] Restart backend (`npm run dev`)
- [ ] Run schema: `npm run seed`
- [ ] Verify setup: `node tests/checkDatabaseConfig.js`
- [ ] Run tests: `node tests/apiTests.js`
- [ ] Check success rate increased to 80%+

---

## Next Features to Setup (Optional)

After database is working:

1. **Email Service**: Update `EMAIL_*` variables in .env
2. **Payment Gateways**: Add `MTN_MOMO_*` and `ORANGE_MONEY_*` keys
3. **Google OAuth**: Add `GOOGLE_CLIENT_*` credentials
4. **File Storage**: Configure S3 or use local uploads

---

## Support & Help

1. **Check Database Setup Guide**: `DATABASE_SETUP.md`
2. **Run Configuration Test**: `node tests/checkDatabaseConfig.js`
3. **Check Backend Logs**: Look at terminal output from `npm run dev`
4. **Test Endpoints**: `node tests/apiTests.js`

---

**Created**: April 23, 2026  
**Platform**: Buy237 E-Commerce  
**Status**: 🟡 Ready for database configuration
