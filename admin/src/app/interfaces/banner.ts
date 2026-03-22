export interface iBanner {
  Ma_banner?: string;
  Tieu_de: string;
  Tieu_de_phu?: string;
  Tieu_de_chinh?: string;
  Hinh_anh: string;
  Anh_nen_mobile?: string;
  Mo_ta?: string;
  Mo_ta_ngan?: string;
  Duong_dan?: string;
  CTA_text?: string;
  CTA_link?: string;
  Loai_overlay?: 'none' | 'dark' | 'light' | 'gradient' | 'custom';
  Mau_overlay?: string;
  Do_mo_overlay?: number;
  Trang: string;
  Thu_tu: number;
  Trang_thai: boolean;
  Ngay_tao?: Date;
  Ngay_cap_nhat?: Date;
  Ma_quan_tri_vien?: string;
  id?: string;
}
