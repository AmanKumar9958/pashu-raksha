// Main entry file
import 'dotenv/config'; // Ensure .env is loaded before other imports

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import dotenv from 'dotenv'; // Removed because we use 'dotenv/config'

// Database connection
import connectDB from './config/db.js';

// Import routes
import caseRoutes from './routes/caseRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Connect to MongoDB
connectDB();

const app = express();

// body parser middleware
app.use(cors());
app.use(express.json());


// Basic testing route
app.get('/', (req, res) => {
    res.send("Pashu Raksha API is running...");
})

// Routes
app.use('/api/cases', caseRoutes);  // case reporting routes
app.use('/api/ngos', ngoRoutes);    // get nearby NGOs
app.use('/api/users', userRoutes);  // user registration routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})