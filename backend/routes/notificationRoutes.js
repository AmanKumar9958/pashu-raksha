import express from 'express';
const router = express.Router();
import { createTransferRequest, getNotifications, respondTransfer } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/transfer', protect, createTransferRequest);
router.get('/', protect, getNotifications);
router.put('/:id/respond', protect, respondTransfer);

export default router;
