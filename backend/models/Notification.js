import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    type: { type: String, enum: ['TRANSFER_REQUEST', 'TRANSFER_ACCEPTED', 'TRANSFER_DECLINED'], default: 'TRANSFER_REQUEST' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' },
    message: { type: String, default: '' },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
