import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { optionalProtect } from '../middleware/optionalAuth.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  listClubs, getClub, createClub, updateClub, deleteClub,
  joinClub, leaveClub, myClubs, removeMember
} from '../controllers/clubController.js';
const router = Router();

router.get('/', optionalProtect, listClubs);
router.get('/mine', protect, myClubs);
router.get('/:id', optionalProtect, getClub);
router.post('/', protect, createClub);
router.put('/:id', protect, updateClub);
router.delete('/:id', protect, deleteClub);
router.post('/:id/join', protect, authorizeRoles('student'), joinClub);
router.delete('/:id/join', protect, authorizeRoles('student'), leaveClub);
router.delete('/:id/members/:userId', protect, removeMember);

export default router;
