import Notification from '../models/Notification.js';
import Case from '../models/Case.js';
import User from '../models/User.js';

// Send a transfer request
export const createTransferRequest = async (req, res) => {
    try {
        const { receiverId, caseId, message } = req.body;
        const senderId = req.user._id;

        // Check if case is really assigned to the sender
        const existingCase = await Case.findById(caseId);
        if (!existingCase) return res.status(404).json({ success: false, message: 'Case not found' });
        if (existingCase.assignedNGO.toString() !== senderId.toString()) {
            return res.status(403).json({ success: false, message: 'You do not own this case.' });
        }

        const notification = await Notification.create({
            sender: senderId,
            receiver: receiverId,
            caseId,
            type: 'TRANSFER_REQUEST',
            message
        });

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error establishing transfer' });
    }
};

// Get notifications for logged in user (both incoming and outgoing depending on query, default incoming)
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user._id })
            .populate('sender', 'name email phone location')
            .populate('caseId', 'description animalType image locationText')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};

// Respond to transfer request
export const respondTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body; // 'ACCEPTED' or 'DECLINED'
        const notification = await Notification.findById(id).populate('sender');

        if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
        if (notification.receiver.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });

        notification.status = status;
        if (message) notification.message = message;
        await notification.save();

        if (status === 'ACCEPTED') {
            const caseDocument = await Case.findById(notification.caseId);
            if (caseDocument) {
                caseDocument.assignedNGO = notification.receiver;
                // Leave it IN PROGRESS, or ensure it's IN PROGRESS. 
                caseDocument.status = 'IN PROGRESS'; 
                await caseDocument.save();

                // To track transferred, we increment the sender's generic "transferredCount" which doesn't formally exist on schema yet
                // But we can just use aggregation in stats to track accepted transfer notifications they sent!
            }
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error responding' });
    }
};
