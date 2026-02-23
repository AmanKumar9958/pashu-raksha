import Case from "../models/Case.js";
import User from "../models/User.js";

const normalizeStatus = (status) => {
    const s = String(status || '').trim().toUpperCase();
    if (s === 'PENDING') return 'PENDING';
    if (s === 'IN PROGRESS' || s === 'IN_PROGRESS' || s === 'RESCUING' || s === 'ACCEPTED') return 'IN PROGRESS';
    if (s === 'RESOLVED' || s === 'SAVED') return 'RESOLVED';
    if (s === 'TRANSFERRED') return 'TRANSFERRED';
    return null;
};

// Get nearby cases (optional geo filter)
export const getNearByCases = async (req, res) => {
    try {
        const { lat, lng, distance } = req.query; // distance in KM

        const hasGeo = lat !== undefined && lng !== undefined && distance !== undefined;
        if (!hasGeo) {
            const cases = await Case.find().sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                length: cases.length,
                data: cases
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const distanceKm = parseFloat(distance);

        if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(distanceKm)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lat/lng/distance query params'
            });
        }

        const cases = await Case.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: distanceKm * 1000
                }
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            length: cases.length,
            data: cases
        });
    } catch (error) {
        console.error(`Error fetching nearby cases: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

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
        // NGO identity from token
        const clerkId = req.auth?.userId;
        if (!clerkId) {
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }

        const ngoUser = await User.findOne({ clerkId });
        if (!ngoUser) {
            return res.status(404).json({ success: false, message: 'NGO user not found' });
        }

        const existing = await Case.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        if (existing.assignedNGO && String(existing.assignedNGO) !== String(ngoUser._id)) {
            return res.status(409).json({ success: false, message: 'Case already assigned to another NGO' });
        }

        const updatedCase = await Case.findByIdAndUpdate(
            req.params.id,
            {
                status: 'IN PROGRESS',
                assignedNGO: ngoUser._id
            },
            { returnDocument: 'after', runValidators: true }
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
        const clerkId = req.auth?.userId;
        if (!clerkId) {
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }

        const ngoUser = await User.findOne({ clerkId });
        if (!ngoUser) {
            return res.status(404).json({ success: false, message: 'NGO user not found' });
        }

        const existing = await Case.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        if (!existing.assignedNGO || String(existing.assignedNGO) !== String(ngoUser._id)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const updatedCase = await Case.findByIdAndUpdate(
            req.params.id,
            { status: 'RESOLVED' },
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedCase });
    } catch (error){
        console.error(`Error resolving case: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Get cases assigned to a specific NGO (by ClerkId)
// scope=ongoing -> PENDING + IN PROGRESS (default)
// scope=all -> includes RESOLVED + TRANSFERRED too
export const getNgoCases = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // Only allow NGO to fetch their own cases
        if (req.auth?.userId && req.auth.userId !== clerkId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const ngoUser = await User.findOne({ clerkId });
        if (!ngoUser) {
            return res.status(404).json({ success: false, message: 'NGO user not found' });
        }

        const scope = String(req.query.scope || 'ongoing').toLowerCase();
        const query = { assignedNGO: ngoUser._id };
        if (scope !== 'all') {
            query.status = { $in: ['PENDING', 'IN PROGRESS'] };
        }

        const cases = await Case.find(query).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, length: cases.length, data: cases });
    } catch (error) {
        console.error(`Error fetching NGO cases: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// NGO updates case status (must be assigned to them; first update can self-assign)
export const updateCaseStatus = async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) {
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }

        const ngoUser = await User.findOne({ clerkId });
        if (!ngoUser) {
            return res.status(404).json({ success: false, message: 'NGO user not found' });
        }

        const nextStatus = normalizeStatus(req.body?.status);
        if (!nextStatus) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Allowed: PENDING, IN PROGRESS, RESOLVED, TRANSFERRED'
            });
        }

        const existing = await Case.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        // If unassigned, allow NGO to self-assign only when moving to IN PROGRESS
        if (!existing.assignedNGO) {
            if (nextStatus !== 'IN PROGRESS') {
                return res.status(403).json({ success: false, message: 'Case is not assigned to you' });
            }
        } else if (String(existing.assignedNGO) !== String(ngoUser._id)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const updatedCase = await Case.findByIdAndUpdate(
            req.params.id,
            {
                status: nextStatus,
                assignedNGO: existing.assignedNGO || ngoUser._id
            },
            { returnDocument: 'after', runValidators: true }
        );

        return res.status(200).json({ success: true, data: updatedCase });
    } catch (error) {
        console.error(`Error updating case status: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Public success stories based on resolved cases
export const getSuccessStories = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10) || 10, 50);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [stories, savedThisMonth] = await Promise.all([
            Case.find({ status: 'RESOLVED' })
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(limit),
            Case.countDocuments({
                status: 'RESOLVED',
                updatedAt: { $gte: startOfMonth, $lte: now }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                savedThisMonth,
                stories
            }
        });
    } catch (error) {
        console.error(`Error fetching success stories: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Get cases reported by a specific Clerk user
export const getUserCases = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // Only allow a user to fetch their own cases
        if (req.auth?.userId && req.auth.userId !== clerkId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const cases = await Case.find({ reporterID: user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            length: cases.length,
            data: cases
        });
    } catch (error) {
        console.error(`Error fetching user cases: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}