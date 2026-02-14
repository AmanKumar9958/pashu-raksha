import Case from "../models/Case.js";

// Create a new case
export const createCase = async (req, res) => {
    try{
        const { reporterID, image, description, category, location } = req.body;

        const newCase = await Case.create({
            reporterID,
            image,
            description,
            category,
            location: {
                type: 'Point',
                coordinates: location
            }
        });

        res.status(201).json({
            success: true,
            data: newCase
        });
    } catch (error){
        console.error(`Error creating case: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Get all cases for NGOs
export const getAllCases = async (req, res) => {
    try{
        const cases = await Case.find().sort({ createdAt: -1});
        res.status(200).json({
            success: true,
            length: cases.length,
            data: cases
        });
    } catch (error){
        console.error(`Error fetching cases: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}