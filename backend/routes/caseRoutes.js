import express from 'express';
const router = express.Router();

import { createCase, getAllCases } from '../controllers/caseController.js';

router.route('/')
    .post(createCase)
    .get(getAllCases);

export default router;