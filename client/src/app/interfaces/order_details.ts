export interface iOrderDetail {
    Ma_chi_tiet: string;      // ObjectId (PK)
    Ma_don_mua: string;       // ObjectId (FK)
    Ma_san_pham: string;      // ObjectId (FK)
    Don_gia: number;
    So_luong: number;
}
