const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order model
const Order = require('../models/Order');

async function generateNextOrderCode() {
    const lastOrder = await Order.findOne({ Ma_don_mua: /^ORD\d+$/ })
        .sort({ Ma_don_mua: -1 })
        .lean();

    const currentNumber = Number(String(lastOrder?.Ma_don_mua || '').replace('ORD', '')) || 0;
    const nextNumber = currentNumber + 1;
    return `ORD${String(nextNumber).padStart(3, '0')}`;
}

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all orders (2) -> using async await
router.get("/orders", async (req, res) => {
    try {
            let orders = await Order.find({});
            res.json(orders);
    }catch (err) {
        res.json({er: err.message});
    }
});

//get order by ID
router.get("/orders/:id", async (req, res) => {
    try {
        let  order = await Order.findOne({ Ma_don_mua: req.params.id });
        if (!order) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/orders/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const orders = await Order.aggregate([
            { $match: { Ma_khach_hang: userId } },
            {
                $lookup: {
                    from: 'order_details',
                    localField: 'Ma_don_mua',
                    foreignField: 'Ma_don_mua',
                    as: 'details'
                }
            }
        ]);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/orders', async (req, res) => {
    try {
        const payload = req.body || {};

        const maDonMua = payload.Ma_don_mua || await generateNextOrderCode();
        const tongTien = Number(payload.Tong_tien || 0);
        const phiVanChuyen = Number(payload.Phi_van_chuyen || 0);

        const newOrder = await Order.create({
            Ma_don_mua: maDonMua,
            Ma_khach_hang: payload.Ma_khach_hang || undefined,
            Thong_tin_giao_hang: payload.Thong_tin_giao_hang || undefined,
            Thong_tin_khach_vang_lai: payload.Thong_tin_khach_vang_lai || undefined,
            Tong_tien: tongTien,
            Hinh_thuc_thanh_toan: payload.Hinh_thuc_thanh_toan || 'Thanh toán toàn bộ',
            Trang_thai: payload.Trang_thai || 'Chờ duyệt',
            Ma_khuyen_mai: payload.Ma_khuyen_mai || undefined,
            Phi_van_chuyen: phiVanChuyen,
            Ghi_chu: payload.Ghi_chu || '',
            Ngay_dat: payload.Ngay_dat || new Date(),
            Ma_quan_tri_vien_duyet: payload.Ma_quan_tri_vien_duyet || undefined,
            updatedAt: new Date(),
        });

        res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update order status
router.patch("/orders/:id", async (req, res) => {
    try {
        const orderId = req.params.id;
        const updateData = req.body;

        const updatedOrder = await Order.findOneAndUpdate(
            { Ma_don_mua: orderId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;