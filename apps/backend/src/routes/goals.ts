import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goals';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
