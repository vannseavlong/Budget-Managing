import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  migrateCategoriesEmoji,
} from '../controllers/categories';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', getCategories);
router.post('/', createCategory);

// Must come before /:id so 'migrate-emojis' isn't swallowed as an id param.
router.post('/migrate-emojis', migrateCategoriesEmoji);

router.get('/:id', getCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
