const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BannerSchema = new Schema({
  Ma_banner: { type: String, required: true, unique: true },
  Tieu_de: { type: String, required: true },
  Tieu_de_phu: { type: String, default: '' },
  Tieu_de_chinh: { type: String, default: '' },
  Hinh_anh: { type: String, required: true },
  Anh_nen_mobile: { type: String, default: '' },
  Mo_ta: { type: String, default: '' },
  Mo_ta_ngan: { type: String, default: '' },
  Duong_dan: { type: String, default: '' },
  CTA_text: { type: String, default: 'Khám phá ngay' },
  CTA_link: { type: String, default: '' },
  Loai_overlay: { type: String, enum: ['none', 'dark', 'light', 'gradient', 'custom'], default: 'dark' },
  Mau_overlay: { type: String, default: '' },
  Do_mo_overlay: { type: Number, default: 0.65 },
  Trang: { type: String, required: true },
  Thu_tu: { type: Number, default: 0 },
  Trang_thai: { type: Boolean, default: true },
  Ngay_tao: { type: Date, default: Date.now },
  Ngay_cap_nhat: { type: Date, default: Date.now },
  Ma_quan_tri_vien: { type: String, default: '' },
});

module.exports = mongoose.model('Banner', BannerSchema);