const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order model
const Order = require('../models/Order');

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