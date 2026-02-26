export interface iReview {
    Ma_danh_gia: string;      // ObjectId (PK)
    Ma_khach_hang: string;    // ObjectId (FK)
    Ma_san_pham: string;      // ObjectId (FK)
    Diem_danh_gia: number;    // VD: 1–5
    Noi_dung: string;
    Hinh_anh?: string[];   // thêm thuộc tính này
    Thoi_gian_gui: Date;
}
