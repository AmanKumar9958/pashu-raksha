import express from 'express';
const router = express.Router();

import { createCase, getAllCases, acceptCase } from '../controllers/caseController.js';

router.route('/')
    .post(createCase)
    .get(getAllCases);

router.put('/:id/accept', acceptCase);

export default router;