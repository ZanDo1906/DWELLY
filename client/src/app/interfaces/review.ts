export interface iReview {
    Ma_danh_gia: string;      // ObjectId (PK)
    Ma_khach_hang: string;    // ObjectId (FK)
    Ma_san_pham: string;      // ObjectId (FK)
    Ma_don_mua: string;       // ObjectId (FK) - Order ID
    Diem_danh_gia: number;    // VD: 1–5
    Noi_dung: string;
    Hinh_anh?: string[];      // Array of image URLs
    Thoi_gian_gui: Date;
}
