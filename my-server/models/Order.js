const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const ShippingInfoSchema = new Scheme(
    {
        Ho_ten_nguoi_nhan: { type: String },
        So_dien_thoai_nguoi_nhan: { type: String },
        Tinh_thanh: { type: String },
        Quan_huyen: { type: String },
        Phuong_xa: { type: String },
        Dia_chi_cu_the: { type: String },
    },
    { _id: false }
);

const GuestInfoSchema = new Scheme(
    {
        Ho_va_ten: { type: String },
        So_dien_thoai: { type: String },
        Email: { type: String },
        Tinh_thanh: { type: String },
        Quan_huyen: { type: String },
        Phuong_xa: { type: String },
        Dia_chi_cu_the: { type: String },
    },
    { _id: false }
);

const Order = new Scheme({
    Ma_don_mua: { type: String, required: true },                 // ObjectId (PK)
    Ma_khach_hang: { type: String },              // ObjectId (FK) - có thể null nếu khách vãng lai
    Thong_tin_giao_hang: { type: ShippingInfoSchema, default: undefined },
    Thong_tin_khach_vang_lai: { type: GuestInfoSchema, default: undefined },
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