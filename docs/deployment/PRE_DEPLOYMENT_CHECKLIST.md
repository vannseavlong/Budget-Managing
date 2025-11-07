# 🚀 Pre-Deployment Checklist

Use this checklist before deploying to production.

## 📋 Backend (Render.com)

### Environment Setup
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `JWT_SECRET` - Generated (click Generate button in Render)
- [ ] `JWT_REFRESH_SECRET` - Generated (click Generate button in Render)

### Google OAuth
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] Added production URLs to Google OAuth redirect URIs
- [ ] Added production URLs to authorized JavaScript origins

### Telegram (Optional)
- [ ] `TELEGRAM_BOT_TOKEN` - From @BotFather
- [ ] `TELEGRAM_BOT_USERNAME` - Your bot username
- [ ] Webhook configured to point to Render backend

### URLs
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `BACKEND_URL` - Your Render deployment URL
- [ ] `ALLOWED_ORIGINS` - Contains your frontend URL

### Render Configuration
- [ ] Branch set to `main`
- [ ] Build command: `bash scripts/render-build.sh`
- [ ] Start command: `node apps/backend/dist/index.js`
- [ ] Health check path: `/health`

---

## 🎨 Frontend (Vercel)

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` - Your Render backend URL
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Same as backend
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_URL` - `https://t.me/YourBotUsername`
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - Your bot username
- [ ] `NEXT_PUBLIC_TELEGRAM_START_PARAM` - `connect_budget_app`
- [ ] `NEXT_PUBLIC_FRONTEND_URL` - Your Vercel URL (auto-filled)

### Vercel Configuration
- [ ] Root directory: `apps/frontend`
- [ ] Framework: Next.js (auto-detected)
- [ ] Build command: Default (uses vercel.json)
- [ ] Output directory: `.next`

---

## 🔐 Security

- [ ] All secrets are generated and secure
- [ ] No hardcoded credentials in code
- [ ] `.env` files are in `.gitignore`
- [ ] CORS configured to only allow your frontend
- [ ] Google OAuth only allows production domains

---

## 🧪 Testing

### Before Deployment
- [ ] Run `npm run build` locally for both apps
- [ ] Run `npm test` for backend
- [ ] Check TypeScript types: `npm run type-check`
- [ ] Run linter: `npm run lint`

### After Deployment
- [ ] Backend health check responds: `/health`
- [ ] Frontend loads successfully
- [ ] Google OAuth login works
- [ ] Can create/read/update/delete budgets
- [ ] Telegram connection works (if configured)
- [ ] No CORS errors in browser console
- [ ] Mobile responsive design works

---

## 📱 Google Cloud Console

- [ ] OAuth consent screen configured
- [ ] Scopes added: `openid`, `profile`, `email`, `drive.file`
- [ ] Production redirect URIs added
- [ ] Test users added (if in testing mode)
- [ ] Publishing status set to Production

---

## 🤖 Telegram Bot

- [ ] Bot created with @BotFather
- [ ] Bot token copied to environment variables
- [ ] Webhook set to: `https://[backend-url]/api/v1/telegram/webhook`
- [ ] Webhook verified with getWebhookInfo
- [ ] Bot username added to environment variables

---

## 📊 Post-Deployment

- [ ] Monitor Render logs for errors
- [ ] Check Vercel deployment logs
- [ ] Test all features in production
- [ ] Set up monitoring/alerts (optional)
- [ ] Document any production-specific configurations

---

## 🔄 Auto-Deployment Setup

- [ ] Main branch protected (require PR reviews)
- [ ] GitHub Actions workflow enabled
- [ ] Render auto-deploy on push to main enabled
- [ ] Vercel auto-deploy on push to main enabled

---

## ✅ Final Verification

Run through these user flows:

1. **Authentication**
   - [ ] Can sign up with Google
   - [ ] Can sign in with existing account
   - [ ] JWT tokens work correctly
   - [ ] Can sign out

2. **Budgets**
   - [ ] Can create new budget
   - [ ] Can view budget list
   - [ ] Can edit budget
   - [ ] Can delete budget
   - [ ] Budget items save correctly

3. **Categories**
   - [ ] Can create category
   - [ ] Categories load in budget form
   - [ ] Can delete category

4. **Transactions**
   - [ ] Can add transaction
   - [ ] Transactions update budget spent amounts
   - [ ] Can view transaction history

5. **Telegram** (if enabled)
   - [ ] Can connect Telegram account
   - [ ] Receives connection confirmation
   - [ ] Can send budget to Telegram
   - [ ] Can disconnect Telegram

---

## 🎉 Ready to Deploy!

Once all checkboxes are checked, you're ready to deploy!

```bash
git checkout main
git merge frontend  # or your feature branch
git push origin main
```

Both Render and Vercel will automatically deploy! 🚀
