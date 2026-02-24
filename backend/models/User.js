// User Database Model

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        unique: true,
        required: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
    },
    role: {
        type: String, 
        enum: ['citizen', 'NGO'],
        default: 'citizen'
    },
    location: {
        type: {type: String, default: 'Point'},
        coordinates: {type: [Number], default: [0, 0], index: '2dsphere'}
    },
    phone: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 10
    },
    ngoDetails: {
        isVerified: {type: Boolean, default: false},
        specialization: [String],
        availableUnits: {type: Number, default: 0},
        address: String,
        createdAt: {type: Date, default: Date.now}
    }
});

userSchema.index({location: "2dsphere"});

// module.exports = mongoose.model('User', userSchema);
export default mongoose.model('User', userSchema);