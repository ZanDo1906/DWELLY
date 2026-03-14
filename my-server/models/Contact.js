const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Contact = new Scheme({
    Ma_lien_he: { type: String, required: true },              // ObjectId (PK)
    Ho_ten: { type: String, required: true },
    Email: { type: String, required: true },
    So_dien_thoai: { type: String },
    Noi_dung: { type: String, required: true },
    Trang_thai: { type: String, required: true },             // VD: "Chưa xử lý", "Đã phản hồi"
    Ngay_gui: { type: Date, default: Date.now },
    Ma_quan_tri_vien_xu_ly: { type: String }, // ObjectId (FK)
    Noi_dung_tra_loi_nhap: { type: String, default: '' },
    Noi_dung_tra_loi: { type: String, default: '' },
});

module.exports = mongoose.model('Contact', Contact);