const express = require('express');
const router = express.Router();

const db = require('../config/db');
db.connect();

const Notification = require('../models/Notification');

// Lấy danh sách thông báo của một người dùng cụ thể
router.get('/notifications/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await Notification.find({ Ma_khach_hang: userId }).sort({ Ngay_tao: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Đánh dấu 1 thông báo là đã đọc
router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const id = req.params.id;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { Da_doc: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Đánh dấu TẤT CẢ thông báo của user là đã đọc
router.patch('/notifications/user/:userId/read-all', async (req, res) => {
    try {
        const userId = req.params.userId;
        await Notification.updateMany(
            { Ma_khach_hang: userId, Da_doc: false },
            { $set: { Da_doc: true } }
        );
        res.json({ message: 'Tất cả thông báo đã được đọc.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Xóa tất cả thông báo của 1 user
router.delete('/notifications/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        await Notification.deleteMany({ Ma_khach_hang: userId });
        res.json({ message: 'Đã xóa tất cả thông báo.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
