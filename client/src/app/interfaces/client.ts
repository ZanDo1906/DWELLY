export interface iClient {
    Ma_khach_hang: string;      // ObjectId
    Ho_va_ten: string;
    So_dien_thoai: string;
    Email: string;
    Mat_khau: string;
    Dia_chi: string[];          // Array<String>
    Trang_thai: boolean;
    Anh_dai_dien: string;
    Ngay_tao: Date;
    Ma_phan_hang: string;       // ObjectId (FK)
    Tong_diem: number;
    favorites: string[];        // Array<String> - Danh sách mã sản phẩm yêu thích
}
