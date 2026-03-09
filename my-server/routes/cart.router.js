const express = require('express');
const router = express.Router();

//Connect to DB
const db = require('../config/db');
db.connect();

//Import Cart model
const Cart = require('../models/Cart');

// GET - Lấy giỏ hàng theo mã khách hàng
router.get("/cart/:maKhachHang", async (req, res) => {
    try {
        const cart = await Cart.findOne({ Ma_khach_hang: req.params.maKhachHang });
        if (!cart) {
            return res.json({ Ma_khach_hang: req.params.maKhachHang, San_pham: [] });
        }
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Thêm sản phẩm vào giỏ hàng (hoặc tăng số lượng nếu đã có)
router.post("/cart/add", async (req, res) => {
    try {
        const { Ma_khach_hang, Ma_san_pham, So_luong } = req.body;

        if (!Ma_khach_hang || !Ma_san_pham) {
            return res.status(400).json({ message: "Thiếu mã khách hàng hoặc mã sản phẩm" });
        }

        const qty = So_luong || 1;

        let cart = await Cart.findOne({ Ma_khach_hang });

        if (!cart) {
            cart = new Cart({
                Ma_khach_hang,
                San_pham: [{ Ma_san_pham, So_luong: qty }]
            });
        } else {
            const existing = cart.San_pham.find(item => item.Ma_san_pham === Ma_san_pham);
            if (existing) {
                existing.So_luong += qty;
            } else {
                cart.San_pham.push({ Ma_san_pham, So_luong: qty });
            }
            cart.updatedAt = Date.now();
        }

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH - Cập nhật số lượng sản phẩm trong giỏ
router.patch("/cart/update", async (req, res) => {
    try {
        const { Ma_khach_hang, Ma_san_pham, So_luong } = req.body;

        if (!Ma_khach_hang || !Ma_san_pham || So_luong == null) {
            return res.status(400).json({ message: "Thiếu thông tin cập nhật" });
        }

        const cart = await Cart.findOne({ Ma_khach_hang });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }

        const item = cart.San_pham.find(i => i.Ma_san_pham === Ma_san_pham);
        if (!item) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });
        }

        item.So_luong = So_luong;
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Xóa một sản phẩm khỏi giỏ hàng
router.delete("/cart/:maKhachHang/:maSanPham", async (req, res) => {
    try {
        const { maKhachHang, maSanPham } = req.params;

        const cart = await Cart.findOne({ Ma_khach_hang: maKhachHang });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }

        cart.San_pham = cart.San_pham.filter(i => i.Ma_san_pham !== maSanPham);
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Xóa toàn bộ giỏ hàng
router.delete("/cart/:maKhachHang", async (req, res) => {
    try {
        const cart = await Cart.findOne({ Ma_khach_hang: req.params.maKhachHang });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }

        cart.San_pham = [];
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
