const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Order = new Scheme({
    Ma_don_mua: { type: String, required: true },                 // ObjectId (PK)
    Ma_khach_hang: { type: String },              // ObjectId (FK) - có thể null nếu khách vãng lai
    Thong_tin_khach_vang_lai: {
        Ho_va_ten: { type: String, required: true },
        So_dien_thoai: { type: String, required: true },
        Dia_chi: { type: String, required: true },
        Email: { type: String },
    },
    Tong_tien: { type: Number, required: true },
    Hinh_thuc_thanh_toan: { type: String, required: true },
    Trang_thai: { type: String, required: true },                 // VD: "Chờ duyệt", "Đang giao", "Hoàn thành", "Trả hàng"
    Ma_khuyen_mai: { type: String },              // ObjectId
    Phi_van_chuyen: { type: Number, default: 0 },
    Ghi_chu: { type: String },
    Ngay_dat: { type: Date, default: Date.now },
    Ma_quan_tri_vien_duyet: { type: String },     // ObjectId (FK)
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', Order);