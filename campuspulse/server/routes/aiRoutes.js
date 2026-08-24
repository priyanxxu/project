import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { optionalProtect } from '../middleware/optionalAuth.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { askAI, recommendations, insights, aiHealth } from '../controllers/aiController.js';

const router=Router();
router.get('/health', aiHealth);
router.post('/assistant', optionalProtect, askAI);
router.post('/recommendations', protect, recommendations);
router.get('/insights', protect, authorizeRoles('organizer'), insights);
export default router;
