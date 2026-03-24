export interface iProduct {
    Ma_san_pham: string;        // ObjectId (PK)
    Ten_san_pham: string;
    Gia_ban: number;
    Mo_ta: string;
    Kich_thuoc: string;         // VD: "200x160x45 cm"
    Chat_lieu: string;
    Hinh_anh: string[];         // Array<String>
    So_luong_ton_kho: number;
    Phan_tram_giam_gia?: number; // Added discount percentage
    Ma_loai_phong: string;      // ObjectId (FK)
    Ma_phong_cach: string;      // ObjectId (FK)
    Ma_danh_muc: string;        // ObjectId (FK)
    Ma_khong_gian: string;      // ObjectId (FK)
    Trang_thai: boolean;
}
