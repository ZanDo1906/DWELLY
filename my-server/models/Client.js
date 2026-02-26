const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Client = new Scheme({
    Ma_khach_hang: { type: String, required: true },      // ObjectId
    Ho_va_ten: { type: String, required: true },
    So_dien_thoai: { type: String, required: true },
    Email: { type: String, required: true },
    Mat_khau: { type: String, required: true },
    Dia_chi: [{ type: String, required: true }],          // Array<String>
    Trang_thai: { type: Boolean, default: true },
    Anh_dai_dien: { type: String },
    Ngay_tao: { type: Date, default: Date.now },
    Ma_phan_hang: { type: String, required: true },       // ObjectId (FK)
    Tong_diem: { type: Number, default: 0 },
    favorites: [{ type: String, required: true }],        // Array<String> - Danh sách mã sản phẩm yêu thích
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', Client);