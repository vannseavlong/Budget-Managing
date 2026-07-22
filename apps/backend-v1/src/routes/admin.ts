import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getStats } from '../controllers/admin';

const router: Router = Router();

// Every route here is admin-only, and every handler in controllers/admin/
// must only ever query the admin-actor `user_stats` table (see TODO.md §1
// and §3) — never a user's own spreadsheet.
router.use(authenticateToken, requireAdmin);

router.get('/stats', getStats);

export default router;
