// backend/middleware/authMiddleware.js
import { createClerkClient } from '@clerk/clerk-sdk-node';

// Clerk client initialize karein
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const protect = async (req, res, next) => {
    try {
        // Clerk session verify karne ke liye logic
        const sessionToken = req.headers.authorization?.split(' ')[1];
        
        if (!sessionToken) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        // Token verify karein
        const session = await clerkClient.verifyToken(sessionToken);
        req.auth = { userId: session.sub }; // Clerk ki userId sub field mein hoti hai
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const requireAuth = (req, res, next) => {
    if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthenticated! Please login first." 
        });
    }
    next();
};