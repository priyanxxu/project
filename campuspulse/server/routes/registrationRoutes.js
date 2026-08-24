import { Router } from 'express';
import { getUserRegistrations } from '../controllers/registrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/user/registrations', protect, authorizeRoles('student'), getUserRegistrations);
export default router;
