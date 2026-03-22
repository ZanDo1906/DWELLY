export interface iVoucher {
    Ma_khuyen_mai: string;          // ObjectId (PK)
    Ma_so: string;
    Phan_tram_giam: number;         // VD: 10 = giảm 10%
    So_luong_con_lai: number;
    Ma_phan_hang_toi_thieu: string; // ObjectId (FK)
    Ngay_bat_dau: Date;
    Ngay_het_han: Date;
    Mo_ta: string;
    Trang_thai: boolean;
    Ma_quan_tri_vien_tao: string;   // ObjectId (FK)
    createdAt?: Date;
    updatedAt?: Date;
}
