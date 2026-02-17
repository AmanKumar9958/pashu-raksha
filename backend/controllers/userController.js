import User from "../models/User.js";

// for creating new user/NGO
export const syncUser = async (req, res) => {
    try{
        const { clerkId, email, name, role, phone, location, ngoDetails } = req.body;

        const user = await User.findOneAndUpdate(
            { clerkId: clerkId }, // Unique ID from Clerk
            { 
                email, 
                name, 
                role, 
                phone, 
                location, 
                ngoDetails 
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
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