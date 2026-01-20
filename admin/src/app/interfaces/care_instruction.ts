export interface iCareInstruction {
    Ma_huong_dan: string;           // ObjectId (PK)
    Ma_danh_muc: string;            // ObjectId (FK)
    Link_video: string[];           // Array<String>
    Huong_dan_ve_sinh: string;
    Huong_dan_dat_san_pham: string;
    Xu_ly_su_co: string;
    Lich_cham_soc: string;
}
