# Budget Manager API Testing Guide

## Overview
This guide provides the **correct testing flow** for the Budget Manager API with Google Sheets integration. The API requires a specific sequence: **Auth → Schema Setup → CRUD operations**.

## 🔄 **NEW REQUIRED FLOW**

### **Phase 1: Authentication (Required)**

#### 1. Health Check
```
GET {{baseUrl}}/health
```

#### 2. Initiate Google OAuth
```
GET {{baseUrl}}/api/v1/auth/google
```
- Copy `authUrl` and visit in browser
- Complete OAuth flow
- Copy JWT token from callback response

#### 3. Get User Profile
```
GET {{baseUrl}}/api/v1/auth/profile
Authorization: Bearer {{token}}
```

### **Phase 2: Database Schema Setup (REQUIRED BEFORE CRUD)**

#### 4. Validate Database
```
GET {{baseUrl}}/api/v1/auth/validate-database
Authorization: Bearer {{token}}
```

#### 5. Setup Database Schema (CRITICAL STEP)
```
POST {{baseUrl}}/api/v1/sheets/setup-schema
Authorization: Bearer {{token}}
```
**This creates the 8 required tables:**
- `users` - User profiles
- `settings` - User preferences
- `categories` - Budget categories  
- `transactions` - Income/expense records
- `budgets` - Monthly budgets
- `budget_items` - Category allocations
- `goals` - Financial goals
- `telegram_messages` - Bot messages

#### 6. Validate Schema Setup
```
GET {{baseUrl}}/api/v1/sheets/validate-schema
Authorization: Bearer {{token}}
```
Confirms all tables are created with proper headers.

### **Phase 3: CRUD Operations (After Schema Setup)**

Only after completing Phase 2 can you use these endpoints:

#### Categories CRUD
```
GET {{baseUrl}}/api/v1/categories
POST {{baseUrl}}/api/v1/categories
PUT {{baseUrl}}/api/v1/categories/:id
DELETE {{baseUrl}}/api/v1/categories/:id
```

#### Transactions CRUD  
```
GET {{baseUrl}}/api/v1/transactions
POST {{baseUrl}}/api/v1/transactions
PUT {{baseUrl}}/api/v1/transactions/:id
DELETE {{baseUrl}}/api/v1/transactions/:id
```

#### Budgets CRUD
```
GET {{baseUrl}}/api/v1/budgets
POST {{baseUrl}}/api/v1/budgets
PUT {{baseUrl}}/api/v1/budgets/:id
DELETE {{baseUrl}}/api/v1/budgets/:id
```

## 🏗️ **Database Architecture**

### **One User = One Google Sheet**
- User's spreadsheet persists across logins
- No new sheets created on re-authentication
- Each table = one sheet tab with headers

### **Schema Structure**
```
📊 Budget Manager - user@email.com
├── 📄 users (id, name, email, password_hash, created_at, updated_at)
├── 📄 settings (user_id, currency, language, dark_mode, telegram_notifications, telegram_chat_id, created_at, updated_at)  
├── 📄 categories (id, user_id, name, color, created_at, updated_at)
├── 📄 transactions (id, user_id, name, amount, category_id, category_name, date, time, notes, receipt_url, created_at, updated_at)
├── 📄 budgets (id, user_id, year, month, income, created_at, updated_at)
├── 📄 budget_items (id, budget_id, category_id, category_name, amount, spent, created_at, updated_at)
├── 📄 goals (id, user_id, name, limit_amount, period, notify_telegram, last_notified_at, created_at, updated_at)
└── 📄 telegram_messages (id, user_id, chat_id, payload, status, error, sent_at, created_at)
```

## ⚠️ **CRITICAL REQUIREMENTS**

1. **Must complete OAuth first** (get valid JWT token)
2. **Must run schema setup** before any CRUD operations  
3. **Schema setup only needed once** per user
4. **One spreadsheet per user** (persistent across sessions)

## 🧪 **Testing Sequence**

### **First Time Setup**
1. Complete OAuth (Steps 1-3)
2. **Run schema setup** (Step 5) 
3. Validate setup (Step 6)
4. Begin CRUD operations

### **Returning User**
1. Complete OAuth (Steps 1-3)
2. Validate existing schema (Step 6)  
3. Begin CRUD operations

### **Troubleshooting**
- **403 errors**: Check JWT token is valid
- **Missing data**: Ensure schema setup completed
- **Empty responses**: Verify correct table structure

## 🎯 **Start Testing**

Begin with Step 1 (Health Check) and follow the sequence exactly. Do not skip the schema setup step - it's required for all CRUD operations to work properly!