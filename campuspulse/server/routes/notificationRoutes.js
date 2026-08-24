import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
const router=Router();
router.get('/notifications',protect,listNotifications);
router.put('/notifications/read-all',protect,markAllRead);
router.put('/notifications/:id/read',protect,markRead);
export default router;
