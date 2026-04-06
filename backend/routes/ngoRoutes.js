import express from 'express';

import { getNearByNGOs, getAllNGOsWithStats } from '../controllers/ngoController.js';

const router = express.Router();

router.get('/nearby', getNearByNGOs);
router.get('/all', getAllNGOsWithStats);

export default router;