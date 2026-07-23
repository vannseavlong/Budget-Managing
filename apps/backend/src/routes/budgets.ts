import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSum,
} from '../controllers/budgets';

// budgets, budget_items, and budget_incomes all mount under this one
// router per the rebuild plan (docs/BACKEND_REBUILD_PLAN.md).
const router: Router = Router();

router.use(authenticateToken);

// ---------------------------------------------------------------------------
// IMPORTANT: /items/* and /incomes/* routes MUST come before /:id routes,
// otherwise Express would match "items"/"incomes" as a budget id.
// ---------------------------------------------------------------------------

// Budget items
router.get('/items', getBudgetItems);
router.post('/items', createBudgetItem);
router.put('/items/:id', updateBudgetItem);
router.delete('/items/:id', deleteBudgetItem);

// Budget incomes (/incomes/sum before /incomes/:id for the same reason)
router.get('/incomes/sum', getIncomeSum);
router.get('/incomes', getIncomes);
router.post('/incomes', createIncome);
router.put('/incomes/:id', updateIncome);
router.delete('/incomes/:id', deleteIncome);

// Budgets
router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
