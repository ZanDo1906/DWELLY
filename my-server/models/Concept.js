const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Concept = new Scheme({
    Ma_khong_gian: { type: String, required: true },      // ObjectId (PK)
    Ten_khong_gian: { type: String, required: true },
    Ma_loai_phong: { type: String, required: true },      // ObjectId (FK)
    Ma_phong_cach: { type: String, required: true },      // ObjectId (FK)
    Hinh_anh: { type: String, required: true },
    Mo_ta: { type: String, required: true },
    Trang_thai: { type: Boolean, default: true },    // Array<String> - Danh sách mã sản phẩm yêu thích
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Concept', Concept);