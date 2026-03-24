const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    Ma_khach_hang: { type: String, required: true }, // ObjectId (FK client)
    Tieu_de: { type: String, required: true },
    Noi_dung: { type: String, required: true },
    Loai: { type: String, enum: ['orders', 'promos', 'system'], default: 'system' },
    Da_doc: { type: Boolean, default: false },
    Lien_ket: { type: String, default: '' }, // Optional URL to navigate when clicked
    Ngay_tao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
