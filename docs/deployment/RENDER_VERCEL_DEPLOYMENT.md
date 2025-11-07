# Deployment Guide - Render.com & Vercel

This guide will help you deploy the Budget Manager application with:
- **Frontend** on Vercel
- **Backend** on Render.com

---

## 📋 Prerequisites

1. GitHub account with your repository
2. Vercel account (free)
3. Render.com account (free)
4. Google Cloud Console project (for OAuth)
5. Telegram Bot (optional, from @BotFather)

---

## 🚀 Part 1: Deploy Backend on Render.com

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your `Budget-Managing` repository
3. Configure the service:
   - **Name:** `budget-manager-backend`
   - **Region:** Oregon (Free)
   - **Branch:** `main`
   - **Root Directory:** Leave empty (it's a monorepo)
   - **Runtime:** Node
   - **Build Command:** 
     ```bash
     npm install && npm run build --workspace=apps/backend
     ```
   - **Start Command:**
     ```bash
     npm run start --workspace=apps/backend
     ```
   - **Plan:** Free

### Step 3: Add Environment Variables
In the Render dashboard, go to **Environment** tab and add:

```bash
NODE_ENV=production
PORT=3001

# JWT Secrets (Click "Generate" for random values)
JWT_SECRET=[Click Generate]
JWT_REFRESH_SECRET=[Click Generate]

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=YourBotUsername

# URLs (Update after deployment)
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://budget-manager-backend.onrender.com
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://budget-manager-backend.onrender.com`

### Step 5: Test Backend
Visit: `https://budget-manager-backend.onrender.com/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-11-07T...",
  "uptime": 123.45,
  "message": "Budget Managing API with Google Sheets integration"
}
```

---

## 🎨 Part 2: Deploy Frontend on Vercel

### Step 1: Prepare Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your `Budget-Managing` repository

### Step 2: Configure Project
1. Click **"Add New Project"**
2. Import `Budget-Managing` repository
3. Configure settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 3: Add Environment Variables
In Project Settings → Environment Variables:

```bash
# Backend API URL (Use your Render backend URL)
NEXT_PUBLIC_API_URL=https://budget-manager-backend.onrender.com

# Google OAuth (Same as backend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Telegram Bot
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/YourBotUsername
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername
NEXT_PUBLIC_TELEGRAM_START_PARAM=connect_budget_app

# Frontend URL (Will be auto-filled by Vercel)
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Copy your frontend URL: `https://your-app.vercel.app`

### Step 5: Update Backend URLs
Go back to Render → Environment Variables and update:
```bash
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Click **"Save Changes"** (this will redeploy the backend)

---

## 🔧 Part 3: Configure Google OAuth

### Update Authorized Redirect URIs
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add to **Authorized redirect URIs:**
   ```
   https://your-app.vercel.app/api/auth/callback/google
   https://budget-manager-backend.onrender.com/api/v1/auth/google/callback
   ```
5. Add to **Authorized JavaScript origins:**
   ```
   https://your-app.vercel.app
   https://budget-manager-backend.onrender.com
   ```

---

## 📱 Part 4: Configure Telegram Bot (Optional)

### Update Webhook URL
1. Get your bot token from @BotFather
2. Set webhook to your Render backend:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://budget-manager-backend.onrender.com/api/v1/telegram/webhook"}'
   ```

### Verify Webhook
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## ✅ Part 5: Verification Checklist

- [ ] Backend health check returns OK: `https://[backend-url]/health`
- [ ] Frontend loads successfully: `https://[frontend-url]`
- [ ] Google OAuth login works
- [ ] Can create/view budgets
- [ ] Can connect Telegram (if configured)
- [ ] API calls from frontend to backend work
- [ ] No CORS errors in browser console

---

## 🔄 Auto-Deployment (Already Configured!)

Both services auto-deploy when you push to `main` branch:

```bash
git checkout main
git merge frontend
git push origin main
```

- **Render** will automatically rebuild and deploy backend
- **Vercel** will automatically rebuild and deploy frontend

---

## 🐛 Troubleshooting

### Backend Not Starting
- Check Render logs: Dashboard → Logs
- Verify all environment variables are set
- Check build command ran successfully

### Frontend Can't Connect to Backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Verify backend is running (health check)

### Google OAuth Not Working
- Verify redirect URIs are correct in Google Console
- Check `GOOGLE_CLIENT_ID` matches in both frontend/backend
- Ensure URLs use HTTPS (not HTTP)

### Telegram Bot Not Responding
- Verify webhook is set correctly
- Check Render logs for webhook errors
- Ensure `TELEGRAM_BOT_TOKEN` is correct

---

## 💡 Important Notes

### Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free (enough for 1 service 24/7)

### Vercel Free Tier
- 100GB bandwidth/month
- Fast global CDN
- Unlimited deployments

### Cost Optimization
- Both services are free for small projects
- Monitor usage in dashboards
- Upgrade only if you exceed limits

---

## 📊 Monitoring

### Render Dashboard
- View logs: Real-time and historical
- Monitor metrics: CPU, Memory, Network
- Check deployment status

### Vercel Dashboard
- Analytics: Page views, performance
- Build logs: Debug deployment issues
- Preview deployments: Test before production

---

## 🔐 Security Checklist

- [ ] JWT secrets are random and secure (use Generate button)
- [ ] Google OAuth credentials are for production domain
- [ ] CORS only allows your frontend URL
- [ ] Environment variables are set in dashboard (not in code)
- [ ] `.env` files are in `.gitignore`

---

## 🎉 You're Done!

Your Budget Manager app is now live:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://budget-manager-backend.onrender.com
- **API Health:** https://budget-manager-backend.onrender.com/health

Share your app and enjoy! 🚀
