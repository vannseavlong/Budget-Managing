import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from '../controllers/transactions';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);

// Must come before /:id so 'summary' isn't swallowed as an id param.
router.get('/summary', getTransactionSummary);

router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
