import User from "../models/User.js";

// for creating new user/NGO
export const createUser = async (req, res) => {
    try{
        const { name, email, role, location, phone, ngoDetails } = req.body;

        const user = await User.create({
            name,
            email,
            role,
            location,
            phone,
            ngoDetails
        });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error){
        console.error(`Error creating user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}