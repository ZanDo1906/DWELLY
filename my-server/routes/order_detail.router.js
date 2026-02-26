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

module.exports = router;