const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Admin = new Scheme({
    Ma_quan_tri_vien: { type: String, required: true },
    Ho_va_ten: { type: String, required: true },
    So_dien_thoai: { type: String, required: true },
    Email: { type: String, required: true },
    Mat_khau: { type: String, required: true },
    Trang_thai: { type: Boolean, default: true },
    Anh_dai_dien: { type: String },
    Ngay_tao: { type: Date, default: Date.now },
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', Admin);