import express from 'express';
const router = express.Router();

import { createCase, getAllCases, getNearByCases, acceptCase, resolveCase, getUserCases, getSuccessStories, getNgoCases, updateCaseStatus } from '../controllers/caseController.js';
import { protect } from '../middleware/authMiddleware.js';

// Nearby cases (supports optional lat/lng/distance query params)
router.get('/nearby', getNearByCases);

// Public success stories + monthly saved count
router.get('/success', getSuccessStories);

// Fetch cases reported by the logged-in user
router.get('/user/:clerkId', protect, getUserCases);

// Fetch cases assigned to the logged-in NGO
router.get('/ngo/:clerkId', protect, getNgoCases);

router.route('/')
    .post(createCase)
    .get(getAllCases);

// NGO accepts a case
router.put('/:id/accept', protect, acceptCase);

// NGO completes a case
router.put('/:id/resolve', protect, resolveCase);

// NGO updates case status (IN PROGRESS / RESOLVED / TRANSFERRED / PENDING)
router.put('/:id/status', protect, updateCaseStatus);

export default router;