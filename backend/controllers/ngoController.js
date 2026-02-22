import User from '../models/User.js';

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
    } catch (error){
        console.error(`Error fetching nearby NGOs: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}