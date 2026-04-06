import User from '../models/User.js';
import Case from '../models/Case.js';
import Notification from '../models/Notification.js';


// Get all NGOs within specified radius
export const getNearByNGOs = async (req, res) => {
    try{
        const { lat, lng, distance } = req.query;   // distance in KM

        const hasGeo = lat !== undefined && lng !== undefined && distance !== undefined;
        if (!hasGeo) {
            const ngos = await User.find({ role: 'NGO' }).sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                length: ngos.length,
                data: ngos
            });
        }

        const latitude = parseFloat(String(lat));
        const longitude = parseFloat(String(lng));
        const distanceKm = parseFloat(String(distance));

        if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(distanceKm) || distanceKm <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lat/lng/distance query params'
            });
        }

        const ngos = await User.find({
            role: 'NGO',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: distanceKm * 1000   // convert KM to meters
                }
            }
        });
        res.status(200).json({
            success: true,
            length: ngos.length,
            data: ngos
        });
    } catch (error) {
        console.error(`Error fetching nearby NGOs: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Get all NGOs with their statistics for transfer list
export const getAllNGOsWithStats = async (req, res) => {
    try {
        const ngos = await User.find({ role: 'NGO' }).select('name location ngoDetails clerkId');
        
        const ngoStats = await Promise.all(ngos.map(async (ngo) => {
            const solved = await Case.countDocuments({ assignedNGO: ngo._id, status: 'RESOLVED' });
            const active = await Case.countDocuments({ assignedNGO: ngo._id, status: 'IN PROGRESS' });
            const transferred = await Notification.countDocuments({ sender: ngo._id, type: 'TRANSFER_REQUEST', status: 'ACCEPTED' });
            
            return {
                ...ngo.toObject(),
                stats: {
                    solved,
                    active,
                    transferred
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: ngoStats
        });
    } catch (error) {
        console.error(`Error fetching NGO stats: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};