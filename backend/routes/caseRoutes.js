import express from 'express';
const router = express.Router();

import { createCase, getAllCases, getNearByCases, acceptCase, resolveCase, getUserCases, getSuccessStories } from '../controllers/caseController.js';
import { protect } from '../middleware/authMiddleware.js';

// Nearby cases (supports optional lat/lng/distance query params)
router.get('/nearby', getNearByCases);

// Public success stories + monthly saved count
router.get('/success', getSuccessStories);

// Fetch cases reported by the logged-in user
router.get('/user/:clerkId', protect, getUserCases);

router.route('/')
    .post(createCase)
    .get(getAllCases);

// NGO accepts a case
router.put('/:id/accept', acceptCase);

// NGO completes a case
router.put('/:id/resolve', resolveCase);

export default router;