# Deployment Guide

Complete guide to deploying Antigravity Budget to production.

## Architecture

- **Backend**: Railway (FastAPI + Python)
- **Frontend**: Vercel (React + Vite)  
- **Database**: Google Sheets (Transactions) + JSON Files (Budgets/Categories)
- **AI**: OpenRouter (Google Gemini)

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- OpenRouter account (https://openrouter.ai)
- Google Cloud Service Account with Sheets API enabled

---

## Part 1: Deploy Backend to Railway

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/antigravity-budget.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Python

### Step 3: Configure Root Directory

1. Click on your service
2. **Settings** → **Root Directory**
3. Set to: `backend`
4. Save

### Step 4: Add Environment Variables

Go to **Variables** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Get from openrouter.ai/keys |
| `SHEET_ID` | `1xy1Rl8...` | From your Google Sheet URL |
| `GOOGLE_CREDENTIALS_JSON` | Paste entire JSON | Copy from credentials.json |
| `SITE_URL` | Leave blank for now | Update after frontend deploy |
| `ALLOWED_ORIGINS` | Leave blank for now | Update after frontend deploy |

**To copy Google credentials:**
1. Open `backend/credentials.json`
2. Select ALL content (Ctrl+A)
3. Copy and paste into Railway variable value

### Step 5: Generate Domain

1. **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy URL (e.g., `https://web-production-1e21.up.railway.app`)
4. Save this for frontend configuration

### Step 6: Verify Deployment

1. Go to **Deployments** tab
2. Wait for build to complete (~1-2 min)
3. Check logs for "Application startup complete"
4. Visit your Railway URL - should see: `{"message":"Expense Tracker API is running"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Backend URL

Edit `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
    }
  ]
}
```

**Commit and push:**
```bash
git add frontend/vercel.json
git commit -m "Update backend URL"
git push
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repo
4. **Configure:**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
5. Click **"Deploy"**

### Step 3: Get Frontend URL

After deployment completes:
1. Copy your Vercel URL (e.g., `https://antigravity-budget-7u76.vercel.app`)

### Step 4: Update Railway Variables

Go back to **Railway** → **Variables**:

1. Update `SITE_URL`:
   ```
   https://your-frontend.vercel.app
   ```

2. Update `ALLOWED_ORIGINS`:
   ```
   https://your-frontend.vercel.app
   ```

3. Railway will auto-redeploy (~30 seconds)

---

## Part 3: Verify Everything Works

### Test the Application

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Enter text: `"Lunch $10, Dinner $20"`
3. Confirm it splits into 2 transactions
4. Click "Save All to Google Sheets"
5. Check your Google Sheet - data should appear!

### Troubleshooting Checklist

- [ ] Railway backend is deployed and running
- [ ] Vercel frontend is deployed
- [ ] `frontend/vercel.json` has correct Railway URL
- [ ] Railway variables all set correctly
- [ ] Google Sheet is shared with service account email
- [ ] Both Drive API and Sheets API enabled in Google Cloud

---

## Common Issues

### Backend 401 Error (OpenRouter)
**Symptom**: "No transactions extracted"
**Fix**: Check `OPENROUTER_API_KEY` is correct in Railway

### Backend 500 Error (Google Sheets or File I/O)
**Symptom**: "Simulated" save or credentials error
**Fix**: 
1. Verify `GOOGLE_CREDENTIALS_JSON` is set
2. Check Google Sheet is shared with service account
3. Enable Drive API in Google Cloud Console
4. **Note:** JSON files (`budgets.json`, `categories.json`) are stored on the filesystem. On Railway ephemeral disk, these reset on deploy. For permanent storage, use a Railway Volume or Volume Mount if needed (though Google Sheets is the primary DB).

### Frontend Can't Connect
**Symptom**: Network errors in browser console
**Fix**:
1. Check `vercel.json` has correct Railway URL
2. Verify `ALLOWED_ORIGINS` in Railway matches Vercel URL
3. Check Railway deployment is running

### CORS Errors
**Symptom**: "Access-Control-Allow-Origin" error
**Fix**: Update `ALLOWED_ORIGINS` in Railway to match exact Vercel URL

---

## Updating Your Deployment

### Backend Changes

```bash
git add backend/
git commit -m "Update backend"
git push
```

Railway auto-deploys on push.

### Frontend Changes

```bash
git add frontend/
git commit -m "Update frontend"
git push
```

Vercel auto-deploys on push.

---

## Custom Domains (Optional)

### Railway
1. Settings → Networking → Custom Domain
2. Add your domain
3. Update DNS records as shown

### Vercel
1. Project Settings → Domains
2. Add your domain
3. Configure DNS

---

## Monitoring & Logs

### Railway Logs
- Deployments → Click deployment → View Logs
- Real-time logging of API requests

### Vercel Logs
- Project → Deployments → Functions
- View frontend errors and build logs

---

## Environment Variable Reference

### Backend (Railway)

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
SHEET_ID=1xy1Rl8xxxxx
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
SITE_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Frontend (Vercel)
No environment variables needed. API configuration in `vercel.json`.

---

## Cost Breakdown (Free Tier)

- **Railway**: $5/month free credits (~500 hours)
- **Vercel**: 100GB bandwidth free
- **OpenRouter**: Pay per use (~$0.001 per request with free models)
- **Google Sheets**: Free (up to API limits)

---

## Security Best Practices

1. ✅ Never commit `credentials.json` to Git
2. ✅ Use environment variables for all secrets
3. ✅ Set specific CORS origins (not `*`)
4. ✅ Rotate API keys periodically
5. ✅ Monitor Railway/Vercel logs for suspicious activity

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- OpenRouter Docs: https://openrouter.ai/docs

---

**Congratulations!** Your expense tracker is now live! 🎉
