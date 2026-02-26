const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const Style = new Scheme({
    Ma_phong_cach: { type: String, required: true },      // ObjectId (PK)
    Ten_phong_cach: { type: String, required: true },
    Mo_ta: { type: String, required: true },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Style', Style);