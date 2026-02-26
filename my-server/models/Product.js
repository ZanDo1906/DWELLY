const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Product = new Scheme({
    Ma_san_pham: { type: String, required: true },
    Ten_san_pham: { type: String, required: true },
    Gia_ban: { type: Number, required: true },
    Mo_ta: { type: String,required: true },
    Kich_thuoc: { type: String, required: true },
    Chat_lieu: { type: String, required: true },
    Hinh_anh: [{ type: String, required: true }],
    So_luong_ton_kho: { type: Number, default: 0 },
    Ma_loai_phong: { type: String, required: true },
    Ma_phong_cach: { type: String, required: true },
    Ma_danh_muc: { type: String, required: true },
    Ma_khong_gian: { type: String, required: true },
    Trang_thai: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', Product);