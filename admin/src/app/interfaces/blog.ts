export interface iBlog {
    Ma_bai_viet: string;          // ObjectId (PK)
    Tieu_de: string;
    Tom_tat: string;
    Noi_dung: any[];     // Can be string or array of content blocks
    Hinh_anh: string;
    Trang_thai: boolean;
    Ngay_tao: Date;
    Ma_quan_tri_vien: string;     // ObjectId (FK)
}
