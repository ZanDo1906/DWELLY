export interface iBlogContent {
    Loai: 'text' | 'image';
    Noi_dung?: string;
    Url?: string;
    Mo_ta?: string;
}

export interface iBlog {
    Ma_bai_viet: string;          // ObjectId (PK)
    Tieu_de: string;
    Tom_tat: string;
    Noi_dung: iBlogContent[];
    Hinh_anh: string;
    Trang_thai: boolean;
    Ngay_tao: Date;
    Ma_quan_tri_vien: string;     // ObjectId (FK)
}
