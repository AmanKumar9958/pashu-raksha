import User from '../models/User.js';

// Get all NGOs within specified radius
export const getNearByNGOs = async (req, res) => {
    try{
        const { lat, lng, distance } = req.query;   // distance in KM
        const ngos = await User.find({
            role: 'NGO',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                        $maxDistance: distance * 1000   // convert KM to meters
                    }
                }
            }
        });
        res.status(200).json({
            success: true,
            length: ngos.length,
            data: ngos
        });
    } catch (error){
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}