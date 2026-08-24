import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, listEvents, myEvents, updateEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getEventRegistrations, registerForEvent, cancelRegistration } from '../controllers/registrationController.js';

const router = Router();
router.get('/', listEvents);
router.get('/organizer/my-events', protect, authorizeRoles('organizer'), myEvents);
router.post('/', protect, authorizeRoles('organizer'), createEvent);
router.get('/:id', getEvent);
router.put('/:id', protect, authorizeRoles('organizer'), updateEvent);
router.delete('/:id', protect, authorizeRoles('organizer'), deleteEvent);
router.post('/:id/register', protect, authorizeRoles('student'), registerForEvent);
router.delete('/:id/register', protect, authorizeRoles('student'), cancelRegistration);
router.get('/:id/registrations', protect, authorizeRoles('organizer', 'admin'), getEventRegistrations);
export default router;
