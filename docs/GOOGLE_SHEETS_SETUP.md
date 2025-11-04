# Google Sheets Integration Setup Guide

This guide will walk you through setting up Google Sheets as the database backend for your Budget Managing application.

## 🔧 Prerequisites

- Google account
- Google Cloud Console access
- Node.js 18+ installed
- Budget Managing monorepo cloned

## 📝 Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 1.2 Enable Required APIs

Enable the following APIs for your project:

1. **Google Sheets API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

2. **Google Drive API**
   - Search for "Google Drive API" 
   - Click "Enable"

3. **Google+ API** (for user info)
   - Search for "Google+ API"
   - Click "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for user type (unless you have Google Workspace)
3. Fill in the required information:
   - **App name**: Budget Managing App
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: Budget Managing Backend
   - **Authorized JavaScript origins**: 
     - `http://localhost:3001` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/v1/auth/google/callback` (development)
     - `https://yourdomain.com/api/v1/auth/google/callback` (production)
5. Click "Create"
6. **Important**: Save the Client ID and Client Secret

## 🔐 Step 2: Environment Configuration

### 2.1 Update Backend Environment

Edit `apps/backend/.env`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-from-step-1.4
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-step-1.4
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback

# JWT Configuration (generate secure secrets)
JWT_SECRET=your-super-secure-jwt-secret-change-this
JWT_EXPIRES_IN=7d

# Other configurations
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug
```

### 2.2 Generate Secure JWT Secret

Use one of these methods to generate a secure JWT secret:

```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 64

# Method 3: Online generator (use a reputable one)
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 🚀 Step 3: Install Dependencies and Start

### 3.1 Install Dependencies

```bash
# From the root directory
npm install

# Or specifically for backend
npm install --workspace=apps/backend
```

### 3.2 Start Development Server

```bash
# Start backend only
npm run dev --workspace=apps/backend

# Or start all services
npm run dev
```

### 3.3 Verify Setup

Check if the server is running:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-04T10:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0",
  "message": "Budget Managing API with Google Sheets integration"
}
```

## 🧪 Step 4: Test Google OAuth Flow

### 4.1 Get Authorization URL

```bash
curl http://localhost:3001/api/v1/auth/google
```

Expected response:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?access_type=offline&scope=...",
  "message": "Please visit this URL to authorize the application"
}
```

### 4.2 Complete OAuth Flow

1. Copy the `authUrl` from the response
2. Open it in a browser
3. Sign in with your Google account
4. Grant the requested permissions
5. You'll be redirected to your callback URL with an authorization code
6. Use the code to complete authentication:

```bash
curl -X POST http://localhost:3001/api/v1/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "your-authorization-code-here"}'
```

### 4.3 Verify Spreadsheet Creation

1. Check your Google Drive
2. Look for a spreadsheet named "Budget Manager - youremail@gmail.com - 2025-11-04"
3. Open it to see the created sheets: users, categories, accounts, transactions, budgets, goals

## 🎨 Step 5: Frontend Integration

### 5.1 Update Frontend Environment

Edit `apps/frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
```

### 5.2 Test Frontend Authentication

The frontend should now be able to:
1. Initiate Google OAuth flow
2. Handle the callback
3. Store the JWT token
4. Make authenticated API calls

## 📊 Step 6: Test Data Operations

Once authenticated, test the CRUD operations:

### Create a Category
```bash
curl -X POST http://localhost:3001/api/v1/data/categories \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Groceries", "type": "expense", "color": "#FF5722"}'
```

### Create an Account
```bash
curl -X POST http://localhost:3001/api/v1/data/accounts \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Chase Checking", "type": "checking", "balance": 1500.00}'
```

### Create a Transaction
```bash
curl -X POST http://localhost:3001/api/v1/data/transactions \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "account-id-from-previous-step",
    "category_id": "category-id-from-previous-step", 
    "amount": 45.67,
    "description": "Test grocery purchase",
    "type": "expense",
    "date": "2025-11-04T10:30:00Z"
  }'
```

### Get Dashboard Data
```bash
curl -X GET http://localhost:3001/api/v1/data/dashboard \
  -H "Authorization: Bearer your-jwt-token"
```

## 🔍 Step 7: Verify Google Sheets Data

1. Open your Google Sheets spreadsheet
2. Check each sheet to see the data:
   - **users**: Your user information
   - **categories**: Created categories
   - **accounts**: Created accounts with updated balances
   - **transactions**: Transaction records

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "Client ID not found" Error
- Verify `GOOGLE_CLIENT_ID` in `.env` file
- Ensure the client ID is correct from Google Cloud Console

#### 2. "Redirect URI mismatch" Error
- Check that the redirect URI in Google Cloud Console matches exactly
- Ensure no trailing slashes or typos

#### 3. "Access denied" During OAuth
- Verify OAuth consent screen is properly configured
- Check that required scopes are added

#### 4. "Spreadsheet not found" Error
- Ensure user has granted Google Sheets and Drive permissions
- Check if the user's token has expired (implement refresh logic)

#### 5. JWT Token Issues
- Verify `JWT_SECRET` is set and consistent
- Check token expiration time
- Ensure Authorization header format: `Bearer token`

### Debug Tips

1. **Enable Debug Logging**
   ```bash
   LOG_LEVEL=debug
   ```

2. **Check Server Logs**
   ```bash
   tail -f apps/backend/logs/combined.log
   ```

3. **Verify Google API Quotas**
   - Go to Google Cloud Console > APIs & Services > Quotas
   - Check Google Sheets API usage

4. **Test API Endpoints**
   Use tools like Postman or curl to test individual endpoints

## 🔒 Security Considerations

### Production Deployment

1. **Use HTTPS**
   - Update redirect URIs to use HTTPS
   - Configure SSL certificates

2. **Secure Environment Variables**
   - Use secret management services
   - Never commit secrets to version control

3. **OAuth Consent Screen**
   - Submit for verification if planning public release
   - Add privacy policy and terms of service

4. **Rate Limiting**
   - Monitor Google Sheets API usage
   - Implement application-level rate limiting

## 🎉 Next Steps

After successful setup:

1. **Develop Frontend UI**: Create React components for budget management
2. **Add Features**: Implement budgets, goals, and reporting features
3. **Enhance Security**: Add input validation, sanitization
4. **Optimize Performance**: Implement caching, batch operations
5. **Add Analytics**: Track user behavior and API usage
6. **Deploy**: Set up production environment with proper security

## 📚 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Project API Documentation](../api/GOOGLE_SHEETS_API.md)

---

**Congratulations!** 🎉 You now have a fully functional budget management system that uses Google Sheets as a free, user-owned database backend. Each user's data is stored in their own Google Drive, providing transparency, ownership, and zero database costs!