# Controller Architecture Guide

This document explains the modular controller architecture implemented for the Budget Manager API.

## Structure

Each API endpoint group (categories, transactions, budgets, etc.) is organized as follows:

```
src/controllers/[entity]/
├── index.ts                    # Export all functions and types
├── types.ts                    # Validation schemas and TypeScript types
├── get[Entity].ts             # GET / endpoint
├── create[Entity].ts          # POST / endpoint  
├── update[Entity].ts          # PUT /:id endpoint
├── delete[Entity].ts          # DELETE /:id endpoint
└── [additional endpoints].ts   # Any other endpoints (e.g., getStats)
```

## Benefits

1. **Separation of Concerns**: Each endpoint has its own file
2. **Maintainability**: Easy to find and modify specific endpoints
3. **Testability**: Individual functions can be unit tested easily
4. **Reusability**: Functions can be imported and used in other contexts
5. **Code Organization**: Clear structure makes the codebase easier to navigate

## Implementation Pattern

### 1. Types File (`types.ts`)
```typescript
import { z } from 'zod';

// Validation schemas
export const createEntitySchema = z.object({
  // Define validation rules
});

export const updateEntitySchema = z.object({
  // Define validation rules (usually optional)
});

// TypeScript types
export type CreateEntityRequest = z.infer<typeof createEntitySchema>;
export type UpdateEntityRequest = z.infer<typeof updateEntitySchema>;

export interface EntityResponse {
  // Define response structure
}
```

### 2. Endpoint Files
```typescript
import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createEntitySchema } from './types';

export async function createEntity(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    
    // Implementation logic here
    
  } catch (error) {
    // Error handling
  }
}
```

### 3. Index File (`index.ts`)
```typescript
// Export all endpoint functions
export { getEntities } from './getEntities';
export { createEntity } from './createEntity';
export { updateEntity } from './updateEntity';
export { deleteEntity } from './deleteEntity';

// Export types and schemas
export * from './types';
```

### 4. Routes Update
```typescript
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getEntities,
  createEntity,
  updateEntity,
  deleteEntity,
} from '../controllers/entities';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getEntities);
router.post('/', createEntity);
router.put('/:id', updateEntity);
router.delete('/:id', deleteEntity);
```

## Current Implementation

### ✅ Completed
- **Categories**: Full CRUD with modular structure
- **Transactions**: Full CRUD + stats endpoint with modular structure
- **Authentication**: Complete OAuth flow with modular structure
- **Goals**: Full CRUD + progress tracking with modular structure

### 🔄 To Migrate
- **Budgets**: Convert from BudgetsController class to modular functions
- **Settings**: Convert from SettingsController class to modular functions
- **Sheets**: Keep as class (utility/service controller)

## Guidelines

1. **One function per file**: Each endpoint should have its own file
2. **Consistent naming**: Use verb + entity pattern (e.g., `getCategories`, `createTransaction`)
3. **Shared types**: Keep validation schemas and types in `types.ts`
4. **Error handling**: Consistent error handling pattern across all endpoints
5. **Authentication**: All endpoints should use `AuthenticatedRequest` type
6. **Validation**: Use Zod schemas for request validation
7. **Logging**: Use the shared logger utility for error logging

This structure makes the codebase much more maintainable and follows modern Node.js/Express best practices.