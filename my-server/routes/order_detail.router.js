const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order Detail model
const Order_Detail = require('../models/Order_Detail');

async function generateNextDetailCode() {
    const lastDetail = await Order_Detail.findOne({ Ma_chi_tiet: /^OD\d+$/ })
        .sort({ Ma_chi_tiet: -1 })
        .lean();

    const currentNumber = Number(String(lastDetail?.Ma_chi_tiet || '').replace('OD', '')) || 0;
    const nextNumber = currentNumber + 1;
    return `OD${String(nextNumber).padStart(3, '0')}`;
}

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all order details (2) -> using async await
router.get("/order_details", async (req, res) => {
    try {
            let order_details = await Order_Detail.find({});
            res.json(order_details);
    }catch (err) {
        res.json({er: err.message});
    }
});

// Get all order details by order ID (Ma_don_mua) - MUST be before /order_details/:id
router.get('/order_details/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log('Fetching order details for order:', orderId);

        const orderDetails = await Order_Detail.find({ Ma_don_mua: orderId });
        console.log('Found', orderDetails.length, 'order details');

        res.json(orderDetails);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// get order detail by detail ID (Ma_chi_tiet)
router.get("/order_details/:id", async (req, res) => {
    try {
        let  order_detail = await Order_Detail.findOne({ Ma_chi_tiet: req.params.id });
        if (!order_detail) {
            return res.status(404).json({ message: "Chi tiết đơn hàng không tồn tại" });
        }
        res.json(order_detail);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/order_details', async (req, res) => {
    try {
        const payload = req.body || {};

        if (!payload.Ma_don_mua || !payload.Ma_san_pham) {
            return res.status(400).json({ message: 'Thiếu mã đơn mua hoặc mã sản phẩm' });
        }

        const detailCode = payload.Ma_chi_tiet || await generateNextDetailCode();

        const created = await Order_Detail.create({
            Ma_chi_tiet: detailCode,
            Ma_don_mua: payload.Ma_don_mua,
            Ma_san_pham: payload.Ma_san_pham,
            Don_gia: Number(payload.Don_gia || 0),
            So_luong: Number(payload.So_luong || 0),
            updatedAt: new Date(),
        });

        res.status(201).json({ message: 'Tạo chi tiết đơn hàng thành công', order_detail: created });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/order_details/bulk', async (req, res) => {
    try {
        const { Ma_don_mua, details } = req.body || {};

        if (!Ma_don_mua || !Array.isArray(details) || details.length === 0) {
            return res.status(400).json({ message: 'Thiếu dữ liệu chi tiết đơn hàng' });
        }

        const createdDetails = [];
        for (const item of details) {
            const detailCode = await generateNextDetailCode();
            const created = await Order_Detail.create({
                Ma_chi_tiet: detailCode,
                Ma_don_mua,
                Ma_san_pham: item.Ma_san_pham,
                Don_gia: Number(item.Don_gia || 0),
                So_luong: Number(item.So_luong || 0),
                updatedAt: new Date(),
            });
            createdDetails.push(created);
        }

        res.status(201).json({ message: 'Tạo danh sách chi tiết đơn hàng thành công', order_details: createdDetails });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;