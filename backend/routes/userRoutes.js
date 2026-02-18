import express from 'express';
import { syncUser, getUserProfile } from '../controllers/userController.js'; // getUserProfile import karein
import { protect, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Profile update/sync karne ke liye
router.post('/sync', protect, requireAuth, syncUser);

// Profile fetch karne ke liye (Corrected)
router.get('/profile/:clerkId', protect, getUserProfile); 

export default router;