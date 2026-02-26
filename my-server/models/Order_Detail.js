const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Order_Detail = new Scheme({
    Ma_chi_tiet: { type: String, required: true },      // ObjectId (PK)
    Ma_don_mua: { type: String, required: true },       // ObjectId (FK)
    Ma_san_pham: { type: String, required: true },      // ObjectId (FK)
    Don_gia: { type: Number, required: true },
    So_luong: { type: Number, required: true },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order_Detail', Order_Detail);