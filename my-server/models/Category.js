const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Category = new Scheme({
    Ma_danh_muc: { type: String, required: true },   // ObjectId (PK)
    Ten_danh_muc: { type: String, required: true },
    Mo_ta: { type: String, required: true },
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', Category);