# Complete Setup Guide: PostgreSQL + Offline + Vercel

## Step 1: Create Free PostgreSQL Database (5 minutes)

### Using Render.com (Recommended for Students)

1. Go to https://render.com
2. Sign up with GitHub or email
3. Click "New +" → "PostgreSQL"
4. Fill in:
   - **Name:** `pbscpf-db`
   - **Database:** `pbscpf`
   - **User:** `postgres`
   - **Region:** Select closest to you
   - **Plan:** Free tier (default)
5. Click "Create Database"
6. Wait 2-3 minutes for creation
7. **Copy the connection string** from "Connections" section
   - Looks like: `postgresql://user:password@host:5432/pbscpf`
8. **IMPORTANT:** Copy the full string with password

---

## Step 2: Update .env with Your Database

1. Open `.env` in your project:
   ```bash
   cd /workspaces/cpfmgt
   ```

2. Replace the `DATABASE_URL` line with your Render connection string:
   ```env
   DATABASE_URL="postgresql://postgres:xxxxx@render.internal:5432/cpfmgt"
   ```

3. Save file

---

## Step 3: Create Database Tables

Run this command to create all tables:

```bash
npx prisma migrate deploy
```

If asked to create migration, run:
```bash
npx prisma migrate dev --name initial
```

Then verify success with:
```bash
npm run db:seed
```

This seeds default data (chart of accounts, settings).

---

## Step 4: Test Offline + Online Sync Locally

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Login without internet:**
   - Turn off WiFi/disconnect internet
   - Go to http://localhost:9002
   - Login: `arif` / `123123`
   - Add a member or transaction
   - ✅ Works offline (stores in IndexedDB)

3. **Turn internet back on:**
   - Changes auto-sync to PostgreSQL
   - Refresh page → data persists

---

## Step 5: Deploy to Vercel (Free)

### Option A: Using CLI (Fast)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /workspaces/cpfmgt
vercel

# Follow prompts:
# - Link to GitHub account
# - Select project name
# - Skip "Modify settings" (press N)
```

### Option B: Using GitHub (Recommended)

1. Push code to GitHub:
   ```bash
   cd /workspaces/cpfmgt
   git add .
   git commit -m "Add PostgreSQL setup + offline sync"
   git push origin main
   ```

2. Go to https://vercel.com
3. Sign in with GitHub
4. Click "Add New..." → "Project"
5. Select your `cpfmgt` repository
6. Click "Import"
7. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add `DATABASE_URL` = your Render connection string
   - Click "Deploy"

---

## Step 6: Configure Render Database for Vercel

1. Go back to Render.com dashboard
2. Click your database "cpfmgt-db"
3. Go to "Connections" tab
4. **For Vercel deployment, use:** External connection string (with `.onrender.com` domain)
5. Update your Vercel environment variable with this new string

---

## How It Works Now

```
┌─────────────────────────────────────────┐
│         User's Browser                  │
│  ┌──────────────────────────────────┐  │
│  │ IndexedDB (Offline Storage)      │  │
│  │ - Members, Transactions, etc.    │  │
│  │ - 50+ MB storage                 │  │
│  └──────────────────────────────────┘  │
│           ↓ Auto Sync ↓                 │
│  ┌──────────────────────────────────┐  │
│  │ localStorage (Login Session)     │  │
│  │ - Works WITHOUT internet         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
           ↓ When Online ↓
┌─────────────────────────────────────────┐
│    Vercel (Your App)                    │
│    /app/api/sync/* endpoints            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Render PostgreSQL                    │
│    - Permanent backup                   │
│    - Unlimited storage                  │
│    - $0 cost                            │
└─────────────────────────────────────────┘
```

---

## Features Enabled

✅ **Offline Mode:**
- Works without internet
- Login saved in browser
- All data stored locally

✅ **Auto Sync:**
- When online, sync to PostgreSQL
- When offline, uses local storage
- No manual upload needed

✅ **Permanent Backup:**
- PostgreSQL keeps all data
- Switch devices, data still there
- Share with team members

✅ **Free Forever:**
- Render.com: Free tier, $0
- Vercel: Free deployment
- Your app: $0 total

---

## Limits (For Reference)

| Item | Limit |
|------|-------|
| IndexedDB (offline) | 50+ MB |
| PostgreSQL (Render free) | 256 MB |
| Vercel bandwidth | 100 GB/month |
| Render DB connections | 90 concurrent |

**Your app uses:** ~16 MB for 1,000 members + 10 years of data ✅

---

## Troubleshooting

### Error: "Can't connect to database"
- Check `DATABASE_URL` in `.env`
- Verify Render database is running
- Test: `psql "your-database-url"`

### Error: "Migration failed"
- Delete `prisma/migrations` folder
- Run: `npx prisma migrate dev --name initial`

### Offline not working
- Clear browser cache
- Restart app
- IndexedDB should auto-initialize

---

## Next Steps After Deployment

1. **Backup database regularly:**
   ```bash
   pg_dump "your-database-url" > backup.sql
   ```

2. **Monitor Render usage:**
   - Go to Render dashboard
   - Check storage/connection usage

3. **Scale when needed:**
   - Upgrade Render to paid ($7/month)
   - Upgrade Vercel to Hobby ($20/month)

---

## Support

- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Prisma docs: https://prisma.io/docs
