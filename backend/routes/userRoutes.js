import express from 'express';

import { syncUser } from '../controllers/userController.js';
import { protect, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync', protect, requireAuth, syncUser);

export default router;