const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Care_Instruction = new Scheme({
    Ma_huong_dan: { type: String, required: true },           // ObjectId (PK)
    Ma_danh_muc: [{ type: String, required: true }],          // ObjectId (FK)
    Link_video: [{ type: String, required: true }],           // Array<String>
    Huong_dan_ve_sinh: { type: String, required: true },
    Huong_dan_dat_san_pham: { type: String, required: true },
    Xu_ly_su_co: { type: String, required: true },
    Lich_cham_soc: { type: String, required: true },  // ObjectId (FK)
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Care_Instruction', Care_Instruction);