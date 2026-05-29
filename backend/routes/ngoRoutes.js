import express from 'express';

import { getNearByNGOs, getAllNGOsWithStats, updateNgoDetails } from '../controllers/ngoController.js';
import { protect, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/nearby', getNearByNGOs);
router.get('/all', getAllNGOsWithStats);
router.put('/details', protect, requireAuth, updateNgoDetails);

export default router;