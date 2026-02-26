const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Voucher = new Scheme({
    Ma_khuyen_mai: { type: String, required: true },          // ObjectId (PK)
    Ma_so: { type: String, required: true },
    Phan_tram_giam: { type: Number, required: true },         // VD: 10 = giảm 10%
    So_luong_con_lai: { type: Number, required: true },
    Ma_phan_hang_toi_thieu: { type: String, required: true }, // ObjectId (FK)
    Ngay_bat_dau: { type: Date, required: true },
    Ngay_het_han: { type: Date, required: true },
    Mo_ta: { type: String, required: true },
    Trang_thai: { type: Boolean, required: true },
    Ma_quan_tri_vien_tao: { type: String, required: true },   // ObjectId (FK)

    updatedAt: { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('Voucher', Voucher);