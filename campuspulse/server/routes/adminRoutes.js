import { Router } from 'express';
import { allRegistrations, approveEvent, organizers, pendingEvents, rejectEvent, stats, users } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(protect, authorizeRoles('admin'));
router.get('/events/pending', pendingEvents);
router.put('/events/:id/approve', approveEvent);
router.put('/events/:id/reject', rejectEvent);
router.get('/users', users);
router.get('/organizers', organizers);
router.get('/stats', stats);
router.get('/registrations', allRegistrations);
export default router;
