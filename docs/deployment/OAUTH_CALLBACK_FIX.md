# 🔧 OAuth Callback Troubleshooting

## Problem: Login redirects to localhost instead of production URL

This happens when environment variables are not properly configured on Render.

---

## ✅ Solution

### **Critical Environment Variables for Render**

You MUST set these in Render dashboard for OAuth to work:

1. **`BACKEND_URL`** - Your Render backend URL
   ```
   BACKEND_URL=https://budget-manager-backend-5uis.onrender.com
   ```

2. **`FRONTEND_URL`** - Your Vercel frontend URL
   ```
   FRONTEND_URL=https://budget-managing-frontend.vercel.app
   ```

3. **`ALLOWED_ORIGINS`** - CORS origins
   ```
   ALLOWED_ORIGINS=https://budget-managing-frontend.vercel.app
   ```

**Without these, the backend will use localhost fallbacks!**

---

## 🚀 Step-by-Step Fix

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add this variable:
   ```
   BACKEND_URL=https://budget-manager-backend-5uis.onrender.com
   ```
   *(Use your actual Render URL)*
5. Click **"Save Changes"** (this will trigger a redeploy)

### Step 2: Verify Google OAuth Callback URLs

Make sure these are in your Google Cloud Console:

**Authorized redirect URIs:**
```
https://budget-managing-frontend.vercel.app/api/auth/callback/google
https://budget-manager-backend-5uis.onrender.com/api/v1/auth/google/callback
```

**Authorized JavaScript origins:**
```
https://budget-managing-frontend.vercel.app
https://budget-manager-backend-5uis.onrender.com
```

### Step 3: Update Environment Variables

**Backend (Render):**
```bash
BACKEND_URL=https://budget-manager-backend-5uis.onrender.com
FRONTEND_URL=https://budget-managing-frontend.vercel.app
ALLOWED_ORIGINS=https://budget-managing-frontend.vercel.app
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://budget-manager-backend-5uis.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://budget-managing-frontend.vercel.app
```

### Step 4: Redeploy Both Services

After updating environment variables:
- Render will auto-redeploy
- Vercel: Go to Deployments → Click "..." → Redeploy

---

## 🔍 How to Verify It's Fixed

1. Clear browser cache/cookies
2. Go to your Vercel app
3. Click "Login with Google"
4. After Google authentication, you should be redirected back to:
   ```
   https://budget-managing-frontend.vercel.app
   ```
   NOT `localhost:3000`

---

## 🐛 Still Not Working?

### Check Backend Logs (Render)
1. Go to Render dashboard → Your service → Logs
2. Look for OAuth redirect URL being used
3. Should show: `https://budget-manager-backend-5uis.onrender.com/api/v1/auth/google/callback`
4. If it shows `localhost:3001`, the `BACKEND_URL` env var is not set

### Check Frontend Console
1. Open browser DevTools → Console
2. Look for API calls
3. Should call: `https://budget-manager-backend-5uis.onrender.com/api/...`
4. If calling `localhost:3001`, the `NEXT_PUBLIC_API_URL` is not set

### Check Google OAuth Consent Screen
1. Make sure it's published (not in testing mode)
2. Or add your email as a test user if in testing mode

---

## ✅ Code Changes Made

I've already updated the backend code to use `BACKEND_URL` environment variable:

**File:** `apps/backend/src/services/GoogleSheetsService.ts`

```typescript
// Before (hardcoded):
const redirectUri = 'http://localhost:3001/api/v1/auth/google/callback';

// After (dynamic):
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const redirectUri = `${backendUrl}/api/v1/auth/google/callback`;
```

This ensures the OAuth flow uses your production URL when `BACKEND_URL` is set.

---

## 📝 Summary

**Root Cause:** Backend OAuth redirect URI was hardcoded to localhost

**Fix:** Set `BACKEND_URL` environment variable in Render

**Verify:** Login should redirect to Vercel app, not localhost

---

## 🚀 Quick Fix Commands

If you need to update and redeploy:

```bash
# Commit the code fix
git add .
git commit -m "fix: use BACKEND_URL env var for OAuth redirect"
git push origin main

# Both services will auto-redeploy
# Add BACKEND_URL to Render dashboard
```

---

Done! Your OAuth flow should now work correctly in production. 🎉
