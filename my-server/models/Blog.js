const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Blog = new Scheme({
    Ma_bai_viet: { type: String, required: true },
    Tieu_de: { type: String, required: true },
    Tom_tat: { type: String, required: true },
    Noi_dung: { type: String, required: true },
    Hinh_anh: { type: String, required: true },
    Trang_thai: { type: Boolean, default: true },
    Ngay_tao: { type: Date, default: Date.now },
    Ma_quan_tri_vien: { type: String, required: true },     // ObjectId (FK)
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', Blog);