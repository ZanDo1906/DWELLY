const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Review model
const Review = require('../models/Review');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

router.get("/reviews", async (req, res) => {
    try {
        const { productId, orderId } = req.query;
        let query = {};
        if (productId) query.Ma_san_pham = productId;
        if (orderId) query.Ma_don_mua = orderId;
        
        let reviews = await Review.find(query);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/reviews", async (req, res) => {
    try {
        const { Ma_khach_hang, Ma_san_pham, Ma_don_mua, Diem_danh_gia, Noi_dung, Hinh_anh } = req.body;
        
        // Validate required fields
        if (!Ma_khach_hang || !Ma_san_pham || !Ma_don_mua || !Diem_danh_gia || !Noi_dung) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newReview = new Review({
            Ma_danh_gia: new Date().getTime().toString(),
            Ma_khach_hang,
            Ma_san_pham,
            Ma_don_mua,
            Diem_danh_gia,
            Noi_dung,
            Hinh_anh: Hinh_anh || [],
            Thoi_gian_gui: new Date()
        });

        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
