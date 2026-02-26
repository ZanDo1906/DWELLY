const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Ranking = new Scheme({
    Ma_phan_hang: { type: String, required: true },      // ObjectId (PK)
    Ten_phan_hang: { type: String, required: true },
    Diem_toi_thieu: { type: Number, required: true },
    Mo_ta: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ranking', Ranking);