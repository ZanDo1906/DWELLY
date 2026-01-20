export interface iConcept {
    Ma_khong_gian: string;      // ObjectId (PK)
    Ten_khong_gian: string;
    Ma_loai_phong: string;      // ObjectId (FK)
    Ma_phong_cach: string;      // ObjectId (FK)
    Hinh_anh: string;
    Mo_ta: string;
    Trang_thai: boolean;
}
