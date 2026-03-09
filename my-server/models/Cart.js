const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const CartItemSchema = new Scheme({
    Ma_san_pham: { type: String, required: true },
    So_luong: { type: Number, required: true, default: 1 },
}, { _id: false });

const Cart = new Scheme({
    Ma_khach_hang: { type: String, required: true, unique: true },
    San_pham: [CartItemSchema],

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', Cart);
