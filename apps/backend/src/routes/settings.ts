import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/settings';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
