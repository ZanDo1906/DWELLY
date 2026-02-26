const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Voucher model
const Voucher = require('../models/Voucher');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all vouchers (2) -> using async await
router.get("/vouchers", async (req, res) => {
    try {
            let vouchers = await Voucher.find({});
            res.json(vouchers);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
