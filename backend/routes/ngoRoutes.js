import express from 'express';

import { getNearByNGOs } from '../controllers/ngoController.js';

const router = express.Router();

router.get('/nearby', getNearByNGOs);

export default router;