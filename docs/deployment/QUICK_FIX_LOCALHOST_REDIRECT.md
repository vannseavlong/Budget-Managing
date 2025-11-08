# ⚡ Quick Fix: Login Redirects to Localhost

## 🎯 The Problem
After Google login, you're redirected to `http://localhost:3000` instead of your Vercel app.

## ✅ The Solution
Add `FRONTEND_URL` environment variable to Render.

---

## 📋 Steps to Fix

### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Select your backend service: `budget-manager-backend`
- Click **Environment** tab

### 2. Add This Environment Variable

Click **"+ Add Environment Variable"** and add:

```
Key:   FRONTEND_URL
Value: https://budget-managing-frontend.vercel.app
```

*(Replace with your actual Vercel URL)*

### 3. Click "Save Changes"
- This will trigger an automatic redeploy
- Wait 2-3 minutes for deployment to complete

### 4. Test
- Clear browser cookies/cache
- Go to your Vercel app
- Click "Login with Google"
- Should now redirect back to Vercel ✅

---

## 📝 Required Render Environment Variables

Make sure ALL of these are set in Render:

```bash
# CRITICAL for OAuth redirect
FRONTEND_URL=https://budget-managing-frontend.vercel.app

# CRITICAL for OAuth callback
BACKEND_URL=https://budget-manager-backend-5uis.onrender.com

# CRITICAL for CORS
ALLOWED_ORIGINS=https://budget-managing-frontend.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets (use "Generate" button in Render)
JWT_SECRET=[auto-generated]
JWT_REFRESH_SECRET=[auto-generated]

# Standard
NODE_ENV=production
PORT=3001
```

---

## 🔍 How to Verify

Check Render logs after login attempt:

✅ **Correct:** 
```
Redirecting to: https://budget-managing-frontend.vercel.app/auth/callback?token=...
```

❌ **Wrong:**
```
Redirecting to: http://localhost:3000/auth/callback?token=...
```

If you see localhost, `FRONTEND_URL` is not set!

---

## 🚀 That's It!

Just add `FRONTEND_URL` to Render and it will work! 🎉
