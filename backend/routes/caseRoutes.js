import express from 'express';
const router = express.Router();

import { createCase, getAllCases, acceptCase, resolveCase } from '../controllers/caseController.js';

router.route('/')
    .post(createCase)
    .get(getAllCases);

// NGO accepts a case
router.put('/:id/accept', acceptCase);

// NGO completes a case
router.put('/:id/resolve', resolveCase);

export default router;