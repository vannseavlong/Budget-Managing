# Budget Managing API - Google Sheets Integration

## Overview

This API uses Google Sheets as the database backend, allowing each user to store their budget data in their own Google Drive. The system automatically creates a spreadsheet with the proper schema when a user first authenticates.

## Authentication Flow

### 1. Initiate Google OAuth
```http
GET /api/v1/auth/google
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "message": "Please visit this URL to authorize the application"
}
```

### 2. Handle OAuth Callback
```http
POST /api/v1/auth/google/callback
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful and database created",
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "spreadsheetId": "1A2B3C4D5E6F7G8H9I0J"
  },
  "token": "jwt_token_here"
}
```

### 3. Use JWT Token
Include the JWT token in subsequent requests:
```http
Authorization: Bearer jwt_token_here
```

## Database Schema

The system automatically creates the following sheets (tables) in the user's Google Spreadsheet:

### Users Table
- `id` (UUID, Primary Key)
- `email` (String)
- `name` (String)
- `created_at` (ISO DateTime)
- `updated_at` (ISO DateTime)

### Categories Table
- `id` (UUID, Primary Key)
- `user_id` (String, Foreign Key to users.email)
- `name` (String)
- `type` (enum: 'income', 'expense')
- `color` (String, hex color)
- `created_at` (ISO DateTime)

### Accounts Table
- `id` (UUID, Primary Key)
- `user_id` (String, Foreign Key to users.email)
- `name` (String)
- `type` (enum: 'checking', 'savings', 'credit', 'cash', 'investment')
- `balance` (Number)
- `currency` (String, 3-letter code)
- `created_at` (ISO DateTime)

### Transactions Table
- `id` (UUID, Primary Key)
- `user_id` (String, Foreign Key to users.email)
- `account_id` (UUID, Foreign Key to accounts.id)
- `category_id` (UUID, Foreign Key to categories.id)
- `amount` (Number)
- `description` (String)
- `type` (enum: 'income', 'expense')
- `date` (ISO DateTime)
- `created_at` (ISO DateTime)

### Budgets Table
- `id` (UUID, Primary Key)
- `user_id` (String, Foreign Key to users.email)
- `category_id` (UUID, Foreign Key to categories.id)
- `amount` (Number)
- `period` (enum: 'weekly', 'monthly', 'yearly')
- `start_date` (ISO DateTime)
- `end_date` (ISO DateTime)
- `created_at` (ISO DateTime)

### Goals Table
- `id` (UUID, Primary Key)
- `user_id` (String, Foreign Key to users.email)
- `name` (String)
- `target_amount` (Number)
- `current_amount` (Number)
- `target_date` (ISO DateTime)
- `created_at` (ISO DateTime)

## API Endpoints

### Authentication

#### Get User Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer jwt_token
```

#### Validate Database Access
```http
GET /api/v1/auth/validate-database
Authorization: Bearer jwt_token
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer jwt_token
```

### Categories

#### Create Category
```http
POST /api/v1/data/categories
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Groceries",
  "type": "expense",
  "color": "#FF5722"
}
```

#### Get Categories
```http
GET /api/v1/data/categories
Authorization: Bearer jwt_token
```

#### Update Category
```http
PUT /api/v1/data/categories/{id}
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Food & Groceries",
  "color": "#FF6B35"
}
```

#### Delete Category
```http
DELETE /api/v1/data/categories/{id}
Authorization: Bearer jwt_token
```

### Accounts

#### Create Account
```http
POST /api/v1/data/accounts
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Chase Checking",
  "type": "checking",
  "balance": 1500.00,
  "currency": "USD"
}
```

#### Get Accounts
```http
GET /api/v1/data/accounts
Authorization: Bearer jwt_token
```

#### Update Account
```http
PUT /api/v1/data/accounts/{id}
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Chase Primary Checking",
  "balance": 1750.00
}
```

#### Delete Account
```http
DELETE /api/v1/data/accounts/{id}
Authorization: Bearer jwt_token
```

### Transactions

#### Create Transaction
```http
POST /api/v1/data/transactions
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "account_id": "account-uuid",
  "category_id": "category-uuid",
  "amount": 45.67,
  "description": "Grocery shopping at Whole Foods",
  "type": "expense",
  "date": "2025-11-04T10:30:00Z"
}
```

#### Get Transactions
```http
GET /api/v1/data/transactions?account_id=uuid&limit=50
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `account_id` (optional): Filter by account
- `category_id` (optional): Filter by category
- `limit` (optional): Limit number of results

#### Update Transaction
```http
PUT /api/v1/data/transactions/{id}
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "amount": 50.00,
  "description": "Updated description"
}
```

#### Delete Transaction
```http
DELETE /api/v1/data/transactions/{id}
Authorization: Bearer jwt_token
```

### Dashboard

#### Get Dashboard Data
```http
GET /api/v1/data/dashboard
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBalance": 2500.50,
      "monthlyIncome": 4000.00,
      "monthlyExpenses": 2800.00,
      "netIncome": 1200.00
    },
    "counts": {
      "accounts": 3,
      "categories": 12,
      "budgets": 5,
      "transactions": 156
    },
    "recentTransactions": [...]
  }
}
```

## Google Sheets Structure

### Example Spreadsheet Layout

**Sheet: categories**
| id | user_id | name | type | color | created_at |
|----|---------|------|------|-------|------------|
| uuid1 | user@example.com | Groceries | expense | #FF5722 | 2025-11-04T10:00:00Z |
| uuid2 | user@example.com | Salary | income | #4CAF50 | 2025-11-04T10:01:00Z |

**Sheet: accounts**
| id | user_id | name | type | balance | currency | created_at |
|----|---------|------|------|---------|----------|------------|
| uuid3 | user@example.com | Chase Checking | checking | 1500.00 | USD | 2025-11-04T10:02:00Z |

**Sheet: transactions**
| id | user_id | account_id | category_id | amount | description | type | date | created_at |
|----|---------|------------|-------------|--------|-------------|------|------|------------|
| uuid4 | user@example.com | uuid3 | uuid1 | 45.67 | Grocery shopping | expense | 2025-11-04T10:30:00Z | 2025-11-04T10:30:00Z |

## Benefits of Google Sheets Backend

### Cost-Effective
- No database hosting costs
- Uses user's own Google Drive storage
- Scales automatically with Google's infrastructure

### User Ownership
- Users own their data
- Can access and modify data directly in Google Sheets
- Easy data export and backup

### Flexibility
- Users can create custom views and reports
- Can integrate with other Google Workspace tools
- Supports real-time collaboration

### Transparency
- Users can see exactly what data is stored
- Easy to audit and verify data integrity
- No vendor lock-in

## Limitations and Considerations

### Rate Limits
- Google Sheets API has rate limits (100 requests per 100 seconds per user)
- Implement appropriate caching and batching strategies

### Data Types
- All data stored as strings in sheets
- Application handles type conversion
- Date formatting should be consistent

### Concurrent Access
- Google Sheets handles concurrent access
- Consider implementing optimistic locking for critical operations

### Security
- Data encrypted in transit (HTTPS)
- Google handles data encryption at rest
- OAuth scopes limit access to only necessary permissions

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `AUTHENTICATION_REQUIRED`: Missing or invalid JWT token
- `GOOGLE_AUTH_EXPIRED`: Google OAuth tokens need refresh
- `SPREADSHEET_NOT_FOUND`: User's spreadsheet not accessible
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Setup Instructions

1. **Create Google Cloud Project**
   - Go to Google Cloud Console
   - Create new project or select existing
   - Enable Google Sheets API and Google Drive API

2. **Configure OAuth**
   - Go to Credentials section
   - Create OAuth 2.0 client ID
   - Add authorized redirect URIs

3. **Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback
   ```

4. **Test Authentication**
   - Start the server
   - Call `/api/v1/auth/google` to get auth URL
   - Complete OAuth flow
   - Verify spreadsheet creation in user's Google Drive

This architecture provides a cost-effective, transparent, and user-controlled data storage solution while maintaining the functionality of a traditional budget management application.