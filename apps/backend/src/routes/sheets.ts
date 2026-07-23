import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { connect, sync, disconnect } from '../controllers/sheets';

const router: Router = Router();

router.use(authenticateToken);

// No live frontend caller today (apps/frontend/lib/api-config.ts defines
// SHEETS.CONNECT/SYNC/DISCONNECT but nothing calls them) — built for
// parity anyway. See controllers/sheets/{connect,sync,disconnect}.ts for
// the reasoning behind each endpoint's behavior.
router.get('/connect', connect);
router.post('/connect', connect);
router.post('/sync', sync);
router.post('/disconnect', disconnect);

export default router;
