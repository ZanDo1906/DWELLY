const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order Detail model
const Order_Detail = require('../models/Order_Detail');

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

module.exports = router;