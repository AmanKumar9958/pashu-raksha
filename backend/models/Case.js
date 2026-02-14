// Case Database Model

import mongoose from "mongoose";

const caseSchema = mongoose.Schema({
    reporterID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: { 
        type: String, 
        required: true // Cloudinary URL yahan store hoga
    },
    description: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        enum: ['Injured', 'Sick', 'Accident', 'Other'], 
        default: 'Other' 
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN PROGRESS', 'RESOLVED', 'TRANSFERRED'],
        default: 'PENDING'
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    assignedNGO: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    createdAt: {type: Date, default: Date.now}
}, {timestamps: true});

caseSchema.index({location: '2dsphere'});

// module.exports = mongoose.model('Case', caseSchema);
export default mongoose.model('Case', caseSchema);