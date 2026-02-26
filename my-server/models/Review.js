const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Review = new Scheme({
    Ma_danh_gia: { type: String, required: true },      // ObjectId (PK)
    Ma_khach_hang: { type: String, required: true },    // ObjectId (FK)
    Ma_san_pham: { type: String, required: true },      // ObjectId (FK)
    Diem_danh_gia: { type: Number, required: true },    // VD: 1–5
    Noi_dung: { type: String, required: true },
    Hinh_anh: [{ type: String }],   // thêm dòng này
    Thoi_gian_gui: { type: Date, default: Date.now },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', Review);