const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order model
const Order = require('../models/Category');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all categories (2) -> using async await
router.get("/categories", async (req, res) => {
    try {
            let orders = await Order.find({});
            res.json(orders);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;