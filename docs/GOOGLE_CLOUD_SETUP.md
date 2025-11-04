# Google Cloud OAuth Setup Guide

This guide will walk you through setting up Google Cloud OAuth2 credentials for the Budget Manager application.

## 🔧 Step 1: Create or Select Google Cloud Project

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### 1.2 Create/Select Project
1. Click on the project dropdown in the top navigation bar
2. Click "New Project" or select an existing project
3. If creating new:
   - **Project name**: `Budget Manager`
   - **Project ID**: `budget-manager-[random-string]` (will be auto-generated)
   - **Organization**: Your organization (if applicable)
4. Click "Create"
5. **Important**: Note down your Project ID - you'll need it later

## 📋 Step 2: Enable Required APIs

Navigate to "APIs & Services" > "Library" and enable the following APIs:

### 2.1 Google Sheets API
1. Search for "Google Sheets API"
2. Click on it and press "Enable"
3. Wait for confirmation

### 2.2 Google Drive API
1. Search for "Google Drive API"  
2. Click on it and press "Enable"
3. Wait for confirmation

### 2.3 Google People API (for user info)
1. Search for "Google People API"
2. Click on it and press "Enable"
3. Wait for confirmation

### ✅ Verification
Go to "APIs & Services" > "Enabled APIs" and confirm you see:
- Google Sheets API
- Google Drive API  
- Google People API

## 🔐 Step 3: Configure OAuth Consent Screen

### 3.1 Access OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose user type:
   - **External**: For personal/public use (recommended for testing)
   - **Internal**: Only for Google Workspace organizations

### 3.2 Fill OAuth Consent Screen (External)

**App Information:**
- **App name**: `Budget Manager`
- **User support email**: Your email address
- **App logo**: (Optional) Upload your app logo
- **App domain**: Leave blank for now
- **Authorized domains**: Leave blank for development
- **Developer contact information**: Your email address

**Scopes:**
Click "Add or Remove Scopes" and add:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile` 
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

**Test Users (for External apps):**
- Add your email address
- Add any other test user emails

Click "Save and Continue" through all steps.

## 🗝️ Step 4: Create OAuth 2.0 Credentials

### 4.1 Create Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"

### 4.2 Configure OAuth Client

**Application type**: Web application

**Name**: `Budget Manager Backend`

**Authorized JavaScript origins**:
```
http://localhost:3001
http://localhost:3000
```

**Authorized redirect URIs**:
```
http://localhost:3001/api/v1/auth/google/callback
```

### 4.3 Download Credentials
1. Click "Create"
2. A popup will show your credentials - **COPY THESE IMMEDIATELY**:
   - **Client ID**: `xxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxx`
3. Click "Download JSON" to save the credentials file

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Update Backend .env File

Edit `apps/backend/.env`:

```bash
# Environment Configuration
NODE_ENV=development
PORT=3001

# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_FROM_STEP_4
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_FROM_STEP_4
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback

# JWT Configuration (generate secure secrets)
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_HERE
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=YOUR_SUPER_SECURE_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRES_IN=30d

# Security Configuration
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### 5.2 Generate Secure JWT Secrets

Use one of these methods:

**Method 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Method 2: PowerShell**
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 0)
```

**Method 3: Online Generator**
Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

## 🧪 Step 6: Test OAuth Setup

### 6.1 Start Backend Server
```bash
cd apps/backend
npm run dev
```

### 6.2 Test OAuth Initiation
Open browser and go to:
```
http://localhost:3001/api/v1/auth/google
```

You should see a JSON response with an `authUrl`. Copy this URL and paste it in a new browser tab.

### 6.3 Complete OAuth Flow
1. Sign in with your Google account
2. Grant permissions for:
   - View your email address
   - View your basic profile info
   - See, edit, create, and delete your spreadsheets in Google Drive
   - See, edit, create, and delete only the specific Google Drive files you use with this app

3. You'll be redirected to the callback URL
4. If successful, you should see a JSON response with a JWT token

## 🛠️ Step 7: Service Account (Optional - For Server-to-Server)

If you need server-to-server access without user interaction:

### 7.1 Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. **Name**: `budget-manager-service`
4. **Description**: `Service account for Budget Manager backend`
5. Click "Create and Continue"

### 7.2 Generate Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose JSON format
5. Download the JSON key file

### 7.3 Add to Environment
```bash
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json
```

## 🔒 Step 8: Security Best Practices

### 8.1 Production Environment
For production deployment:

1. **Use HTTPS**: Update redirect URIs to use `https://`
2. **Secure Secrets**: Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Environment Separation**: Use different Google Cloud projects for dev/staging/production
4. **Domain Verification**: Add your production domain to authorized domains

### 8.2 OAuth Consent Screen Verification
For public release:
1. Submit OAuth consent screen for verification
2. Add privacy policy and terms of service URLs
3. Complete security assessment if required

## 🚨 Step 9: Troubleshooting

### Common Issues:

**1. "Error 400: redirect_uri_mismatch"**
- Verify redirect URI in Google Cloud Console matches exactly
- Ensure no trailing slashes
- Check for typos

**2. "Access blocked: This app's request is invalid"**
- Check OAuth consent screen configuration
- Ensure required scopes are added
- Verify app is not suspended

**3. "Invalid client: no application name"**
- Complete OAuth consent screen setup
- Add app name and required fields

**4. "Access denied"**
- Check if user email is added to test users (for external apps)
- Verify required permissions are granted

### Debug Steps:
1. Check Google Cloud Console > APIs & Services > Quotas
2. Verify API keys and permissions
3. Check application logs for detailed error messages
4. Test with different Google accounts

## ✅ Step 10: Verification Checklist

- [ ] Google Cloud project created
- [ ] APIs enabled (Sheets, Drive, People)
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Environment variables updated
- [ ] JWT secrets generated
- [ ] OAuth flow tested successfully
- [ ] User can authenticate and get token
- [ ] Spreadsheet creation works

## 📚 Next Steps

After successful OAuth setup:
1. Test spreadsheet creation endpoint
2. Verify Google Sheets integration
3. Test frontend authentication flow
4. Configure production environment
5. Deploy to hosting platform

## 🔗 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google People API Documentation](https://developers.google.com/people)

---

**Important**: Keep your OAuth credentials secure and never commit them to version control. Use environment variables or secure secret management services in production.