import User from "../models/User.js";
import Case from "../models/Case.js";
import Notification from "../models/Notification.js";


// 1. Sync User/NGO (Create or Update)
export const syncUser = async (req, res) => {
    try {
        const { clerkId, email, name, role, phone, location, ngoDetails } = req.body;

        const updateDoc = {
            email,
            name,
            role,
            phone,
        };

        // Location is optional (user can sign up from anywhere). Only update if provided.
        if (location !== undefined) updateDoc.location = location;
        if (ngoDetails !== undefined) updateDoc.ngoDetails = ngoDetails;

        const user = await User.findOneAndUpdate(
            { clerkId: clerkId },
            updateDoc,
            { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(`Error syncing user: ${error.message}`);

        if (error?.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

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

        // --- Calculate Real-time Stats ---
        let stats = {
            solved: 0,
            active: 0,
            filed: 0,
            transferred: 0,
            saved: 0
        };

        if (user.role === 'NGO') {
            stats.solved = await Case.countDocuments({ assignedNGO: user._id, status: 'RESOLVED' });
            stats.active = await Case.countDocuments({ assignedNGO: user._id, status: 'IN PROGRESS' });
            stats.transferred = await Notification.countDocuments({ sender: user._id, type: 'TRANSFER_REQUEST', status: 'ACCEPTED' });
            stats.totalImpact = stats.solved; // Animals saved essentially
        } else {
            // Citizen stats
            stats.filed = await Case.countDocuments({ reporterID: user._id });
            stats.solved = await Case.countDocuments({ reporterID: user._id, status: 'RESOLVED' });
            stats.active = await Case.countDocuments({ reporterID: user._id, status: 'IN PROGRESS' });
            stats.saved = stats.solved; 
        }

        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                stats
            }
        });
    } catch (error) {
        console.error(`Error fetching profile: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};