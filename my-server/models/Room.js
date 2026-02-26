const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Room = new Scheme({
    Ma_loai_phong: { type: String, required: true },      // ObjectId (PK)
    Ten_loai_phong: { type: String, required: true },
    Mo_ta: { type: String, required: true },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', Room);