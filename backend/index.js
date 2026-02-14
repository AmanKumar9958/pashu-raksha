// Main entry file

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

import caseRoutes from './routes/caseRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// body parser middleware
app.use(express.json());
app.use(cors());


// Basic testing route
app.get('/', (req, res) => {
    res.send("Pashu Raksha API is running...");
})

app.use('/api/cases', caseRoutes);  // case reporting routes
app.use('/api/ngos', ngoRoutes);    // get nearby NGOs

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})