import User from "../models/User.js";

// 1. Sync User/NGO (Create or Update)
export const syncUser = async (req, res) => {
    try {
        const { clerkId, email, name, role, phone, location, ngoDetails } = req.body;

        const user = await User.findOneAndUpdate(
            { clerkId: clerkId },
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
    } catch (error) {
        console.error(`Error syncing user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// 2. NEW: Get User Profile by ClerkId
export const getUserProfile = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // DB se user dhoondein
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found in PashuRakshaDB"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(`Error fetching profile: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};