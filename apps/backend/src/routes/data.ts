import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getDashboard,
} from '../controllers/data';

const router = Router();

// All data routes require authentication
router.use(authenticateToken);

// Categories routes
router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Accounts routes
router.post('/accounts', createAccount);
router.get('/accounts', getAccounts);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

// Transactions routes
router.post('/transactions', createTransaction);
router.get('/transactions', getTransactions);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Dashboard route
router.get('/dashboard', getDashboard);

export default router;
