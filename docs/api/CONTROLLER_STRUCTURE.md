# Budget Manager API - Controller & Route Structure

This document outlines the complete API structure for the Budget Manager application with Google Sheets integration.

## 🏗️ Architecture Overview

The API is built using a modular architecture with the following components:

- **Controllers**: Handle business logic and request/response processing
- **Routes**: Define API endpoints and middleware
- **Services**: Handle Google Sheets operations and external integrations
- **Middleware**: Authentication, validation, and security

## 📁 File Structure

```
src/
├── controllers/
│   ├── AuthController.ts          # Google OAuth authentication
│   ├── SheetsController.ts        # Google Sheets management
│   ├── CategoriesController.ts    # Expense categories CRUD
│   ├── TransactionsController.ts  # Transaction management
│   ├── BudgetsController.ts       # Budget and budget items
│   ├── GoalsController.ts         # Spending goals and limits
│   ├── SettingsController.ts      # User preferences
│   ├── TelegramController.ts      # Telegram bot integration
│   └── DataController.ts          # Legacy data endpoints
├── routes/
│   ├── auth.ts                    # Authentication routes
│   ├── sheets.ts                  # Google Sheets routes
│   ├── categories.ts              # Categories routes
│   ├── transactions.ts            # Transactions routes
│   ├── budgets.ts                 # Budgets routes
│   ├── goals.ts                   # Goals routes
│   ├── settings.ts                # Settings routes
│   ├── telegram.ts                # Telegram routes
│   └── data.ts                    # Legacy data routes
└── services/
    └── GoogleSheetsService.ts     # Core Google Sheets integration
```

## 🔐 Authentication Flow

### Google OAuth 2.0 Integration

```typescript
// AuthController.ts - Key Methods
class AuthController {
  async initiateAuth()         // Start OAuth flow
  async handleCallback()       // Process OAuth callback
  async getProfile()          // Get user profile
  async refreshToken()        // Refresh access token
  async logout()              // Logout user
}
```

**Routes:**
- `GET /api/v1/auth/google` - Initiate OAuth
- `POST /api/v1/auth/google/callback` - Handle callback
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

## 📊 Google Sheets Integration

### Spreadsheet Management

```typescript
// SheetsController.ts - Key Methods
class SheetsController {
  async createUserDatabase()     // Create user's spreadsheet
  async getSpreadsheetInfo()     // Get spreadsheet details
  async shareSpreadsheet()       // Share with others
  async exportData()             // Export spreadsheet data
  async importData()             // Import data to sheets
  async initializeSchema()       // Setup sheet structure
  async createBackup()           // Create backup copy
}
```

**Routes:**
- `POST /api/v1/sheets/create` - Create database
- `GET /api/v1/sheets/info` - Get spreadsheet info
- `POST /api/v1/sheets/share` - Share spreadsheet
- `GET /api/v1/sheets/export` - Export data
- `POST /api/v1/sheets/import` - Import data
- `POST /api/v1/sheets/schema/init` - Initialize schema
- `POST /api/v1/sheets/backup` - Create backup

### Database Schema (Google Sheets)

Each user gets a spreadsheet with these sheets (tables):

1. **users** - User information
2. **settings** - User preferences and configuration
3. **categories** - Expense/income categories
4. **transactions** - Financial transactions
5. **budgets** - Monthly/yearly budgets
6. **budget_items** - Budget allocations per category
7. **goals** - Spending limits and goals
8. **telegram_messages** - Telegram notification history

## 💰 Financial Data Management

### Categories Controller

```typescript
// CategoriesController.ts
class CategoriesController {
  async getCategories()       // List all categories
  async createCategory()      // Create new category
  async updateCategory()      // Update category
  async deleteCategory()      // Delete category
}
```

**Routes:**
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Transactions Controller

```typescript
// TransactionsController.ts
class TransactionsController {
  async getTransactions()         // List transactions (with filters)
  async createTransaction()       // Create new transaction
  async updateTransaction()       // Update transaction
  async deleteTransaction()       // Delete transaction
  async getTransactionStats()     // Get spending statistics
}
```

**Routes:**
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/transactions/stats` - Get statistics

### Budgets Controller

```typescript
// BudgetsController.ts
class BudgetsController {
  async getBudgets()          // List budgets
  async createBudget()        // Create budget
  async updateBudget()        // Update budget
  async deleteBudget()        // Delete budget
  async getBudgetItems()      // Get budget items
  async createBudgetItem()    // Create budget item
  async updateBudgetItem()    // Update budget item
  async deleteBudgetItem()    // Delete budget item
}
```

**Routes:**
- `GET /api/v1/budgets` - List budgets
- `POST /api/v1/budgets` - Create budget
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget
- `GET /api/v1/budgets/:budgetId/items` - Get budget items
- `POST /api/v1/budgets/items` - Create budget item
- `PUT /api/v1/budgets/items/:id` - Update budget item
- `DELETE /api/v1/budgets/items/:id` - Delete budget item

### Goals Controller

```typescript
// GoalsController.ts
class GoalsController {
  async getGoals()            // List spending goals
  async createGoal()          // Create new goal
  async updateGoal()          // Update goal
  async deleteGoal()          // Delete goal
  async checkGoalProgress()   // Check goal progress
}
```

**Routes:**
- `GET /api/v1/goals` - List goals
- `POST /api/v1/goals` - Create goal
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal
- `GET /api/v1/goals/:id/progress` - Check progress

## ⚙️ User Management

### Settings Controller

```typescript
// SettingsController.ts
class SettingsController {
  async getSettings()         // Get user settings
  async updateSettings()      // Update settings
  async resetSettings()       // Reset to defaults
}
```

**Routes:**
- `GET /api/v1/settings` - Get settings
- `PUT /api/v1/settings` - Update settings
- `POST /api/v1/settings/reset` - Reset settings

## 📱 Telegram Integration

### Telegram Controller

```typescript
// TelegramController.ts
class TelegramController {
  async getMessages()         // Get message history
  async sendMessage()         // Send notification
  async configureWebhook()    // Setup webhook
  async handleWebhook()       // Handle incoming updates
  async testConnection()      // Test bot connection
}
```

**Routes:**
- `GET /api/v1/telegram/messages` - Message history
- `POST /api/v1/telegram/send` - Send message
- `POST /api/v1/telegram/configure` - Configure webhook
- `POST /api/v1/telegram/webhook` - Webhook endpoint
- `GET /api/v1/telegram/test` - Test connection

## 🔒 Security Features

### Middleware Stack

1. **Authentication** (`authenticateToken`)
   - JWT token validation
   - Google OAuth token refresh
   - User context injection

2. **Security** (`securityMiddleware`)
   - Helmet.js security headers
   - CORS configuration
   - Rate limiting

3. **Validation**
   - Zod schema validation
   - Input sanitization
   - Type safety

### Error Handling

- Comprehensive error responses
- Structured error logging
- Graceful failure handling

## 📋 Request/Response Examples

### Authentication
```bash
# Initiate OAuth
GET /api/v1/auth/google
Response: { authUrl: "https://accounts.google.com/oauth/..." }

# Complete OAuth
POST /api/v1/auth/google/callback
Body: { "code": "auth_code" }
Response: { token: "jwt_token", user: {...} }
```

### Create Transaction
```bash
POST /api/v1/transactions
Headers: { Authorization: "Bearer jwt_token" }
Body: {
  "name": "Grocery shopping",
  "amount": 45.67,
  "category_id": "cat_123",
  "category_name": "Groceries",
  "date": "2025-11-04T14:30:00Z"
}
Response: { success: true, data: {...} }
```

### Create Google Sheets Database
```bash
POST /api/v1/sheets/create
Headers: { Authorization: "Bearer jwt_token" }
Body: { "name": "My Budget", "template": "default" }
Response: {
  success: true,
  data: {
    spreadsheet_id: "sheet_id",
    spreadsheet_url: "https://docs.google.com/...",
    sheets_created: ["users", "categories", ...]
  }
}
```

## 🚀 Implementation Status

### ✅ Completed
- Complete controller structure
- All route definitions
- Swagger documentation
- Validation schemas
- Error handling framework

### 🚧 In Progress
- Google Sheets service implementation
- JWT authentication fixes
- Middleware optimization

### 📋 Pending
- Telegram bot integration
- Real Google Sheets CRUD operations
- Frontend integration
- Testing suite
- Deployment configuration

## 📚 Next Steps

1. **Fix TypeScript compilation errors**
2. **Implement Google Sheets CRUD operations**
3. **Set up Google Cloud OAuth credentials**
4. **Test API endpoints with Postman collection**
5. **Integrate with frontend application**
6. **Add comprehensive testing**
7. **Deploy to production environment**

---

**Note**: All controllers include placeholder implementations with proper structure. The actual Google Sheets integration will be implemented in the GoogleSheetsService class with proper CRUD operations, error handling, and data synchronization.