# 🚀 ELYANIS BACKEND — DEPLOYMENT QUICK REFERENCE

## ✅ Local Development (Already Ready)

```bash
# 1. Start PostgreSQL (localhost:5432)
# → elyanis_dev database

# 2. Sync database schema
npm run db:push

# 3. Start dev server
npm run dev
# → Server runs on http://localhost:3000
```

**Local .env is configured ✅**
- DATABASE: `postgresql://postgres:postgres@localhost:5432/elyanis_dev`
- JWT: `HmouJCyAIJGgp8k98oEF0LW+nsEZIILgbmXRNq4Tnyk=` (local dev)
- Frontend: `http://localhost:8080`

---

## 🔧 Production on Render (NEXT STEPS)

### 1️⃣ Add Environment Variables

Go to: **Render Dashboard → Your Backend Service → Settings → Environment**

```
DATABASE_URL = postgresql://elyanis_user:vD0Vsz60qNeyfjcNTcfR1daw6oTddG3M@dpg-d7nq9mgsfn5c73e8rmbg-a:5432/elyanis?schema=public
NODE_ENV = production
JWT_ACCESS_SECRET = GxgpCpGmpKskLmQd0XUKHIoXjHo3vIxwH+1OT5yOIz8=
PORT = 3000
FRONTEND_ORIGIN = https://elyanis.com

SUPABASE_PROJECT_URL = https://jsbvblnnjegujepsokuz.supabase.co
SUPABASE_ANON_KEY = sb_publishable_N3PrCe0wnF2xACympReblQ_rCbBhwjV
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYnZibG5uamVndWplcHNva3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI4OTk1NCwiZXhwIjoyMDkyODY1OTU0fQ.J-2hgtcqAhwkIi3VxaJJdLVXGltOBghuhyvwz2fdmqI
SUPABASE_STORAGE_BUCKET = property-photos
```

### 2️⃣ Verify Build Commands

**Settings → Build & Deploy:**
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npm start`
- Runtime: Node.js 20+

### 3️⃣ Deploy

```bash
git push  # Auto-deploys to Render
# OR manually: Render Dashboard → Trigger deploy
```

---

## ✨ Key Differences: Local vs Production

| Setting | Local Dev | Production |
|---------|-----------|-----------|
| DATABASE | `localhost:5432` | `dpg-d7nq...` (Render addon) |
| JWT Secret | `HmouJCyAIJGgp...` | `GxgpCpGmpKskLm...` ⚠️ **DIFFERENT** |
| NODE_ENV | `development` | `production` |
| FRONTEND | `http://localhost:8080` | `https://elyanis.com` |
| Prisma | Dev migrations OK | Schema stays in sync |

---

## 🔍 Verify Deployment Success

```bash
# 1. Check service status: Render Dashboard → "Live" ✅
# 2. View logs: Render Dashboard → Logs → Look for "api_started"
# 3. Test API:  curl https://your-service-name.onrender.com/
# 4. Check CORS: Open https://elyanis.com → DevTools Network tab
#    → API response should have: Access-Control-Allow-Origin: https://elyanis.com
```

---

## ⚠️ Critical Points

✅ **DATABASE_URL includes `:5432` port**
✅ **JWT_ACCESS_SECRET is different from local**
✅ **FRONTEND_ORIGIN uses `https://` (not `http://`)**
✅ **FRONTEND_ORIGIN matches Vercel domain exactly**
✅ **NODE_ENV is `production` (lowercase)**
✅ **All Supabase variables present**

---

## 📋 Configuration Files Reference

| File | Purpose |
|------|---------|
| `.env` | Local development (already configured) |
| `RENDER_ENV_CONFIG.txt` | Exact variables for Render dashboard |
| `DEPLOYMENT_CHECKLIST.txt` | Full deployment guide (step-by-step) |
| `env-validator.js` | Validate config: `node env-validator.js` |

---

## 🆘 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| `CONFIGURATION — variables obligatoires manquantes` | Add DATABASE_URL, JWT_ACCESS_SECRET, FRONTEND_ORIGIN to Render env |
| `ECONNREFUSED` (DB error) | Check DATABASE_URL format includes `:5432` |
| `CORS policy error` in browser | Verify FRONTEND_ORIGIN is `https://elyanis.com` (no trailing slash) |
| `JWT_ACCESS_SECRET trop court` | Secret must be 32+ characters (use provided one) |
| API doesn't respond | Check "Live" status in Render dashboard, wait 30s for full startup |

---

## 📞 What to Do Next

1. **Right now**: Copy env variables from `RENDER_ENV_CONFIG.txt`
2. **In Render Dashboard**: Paste variables in Settings → Environment
3. **Push changes**: `git push` or manually trigger deploy
4. **Monitor**: Watch Render logs for "api_started" + "database_ready"
5. **Test**: Call API from frontend, verify CORS headers

**Done!** 🎉 Your backend is deploying to production.

---

*For detailed step-by-step guide, see: `DEPLOYMENT_CHECKLIST.txt`*
