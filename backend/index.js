// Main entry file

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})