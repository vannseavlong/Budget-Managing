import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getStats } from '../controllers/admin';

const router: Router = Router();

// Every route in this domain is admin-only.
router.use(authenticateToken, requireAdmin);

router.get('/stats', getStats);

export default router;
