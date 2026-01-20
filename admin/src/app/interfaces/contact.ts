export interface iContact {
    Ma_lien_he: string;              // ObjectId (PK)
    Ho_ten: string;
    Email: string;
    So_dien_thoai: number;
    Noi_dung: string;
    Trang_thai: string;             // VD: "Chưa xử lý", "Đã phản hồi"
    Ngay_gui: Date;
    Ma_quan_tri_vien_xu_ly?: string; // ObjectId (FK)
}
