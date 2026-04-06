import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('CRITICAL: CLOUDINARY_CLOUD_NAME is missing from environment variables!');
}

export default cloudinary;
