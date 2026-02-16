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

// NGO Accepts a case
export const acceptCase = async (req, res) => {
    try{
        const { ngoID } = req.body;

        const updatedCase = await Case.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'ACCEPTED',
                assignedNGO: ngoID
            },
            { new: true }
        );

        if(!updatedCase){
            return res.status(404).json({
                success: false,
                message: 'Case not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedCase
        });
    } catch (error){
        console.error(`Error accepting case: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// NGO Marks case as resolved
export const resolveCase = async (req, res) => {
    try{
        const updatedCase = await Case.findByIdAndUpdate(
            req.params.id,
            { status: 'RESOLVED' },
            { new: true }
        )
        res.status(200).json({
            success: true,
            data: updatedCase
        });
    } catch (error){
        console.error(`Error resolving case: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}