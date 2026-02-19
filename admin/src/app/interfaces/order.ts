export interface iOrder {
    Ma_don_mua: string;                 // ObjectId (PK)
    Ma_khach_hang?: string;              // ObjectId (FK) - có thể null nếu khách vãng lai
    Thong_tin_khach_vang_lai?: {
        Ho_va_ten: string;
        So_dien_thoai: string;
        Dia_chi: string;
        Email?: string;
    };
    Tong_tien: number;
    Hinh_thuc_thanh_toan: string;
    Trang_thai: string;                 // VD: "Chờ duyệt", "Đang giao", "Hoàn thành", "Trả hàng"
    Ma_khuyen_mai?: string;              // ObjectId
    Phi_van_chuyen: number;
    Ghi_chu: string;
    Ngay_dat: Date;
    Ma_quan_tri_vien_duyet?: string;     // ObjectId (FK)
}
