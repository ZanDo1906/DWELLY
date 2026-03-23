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

// get next voucher code
router.get("/vouchers/next-code", async (req, res) => {
    try {
        const lastVoucher = await Voucher.findOne({
            Ma_khuyen_mai: /^KM\d{1,4}$/i
        }).sort({ Ma_khuyen_mai: -1 });

        let newNumber = 1;
        if (lastVoucher && lastVoucher.Ma_khuyen_mai) {
            const match = lastVoucher.Ma_khuyen_mai.match(/^KM(\d+)$/i);
            if (match) {
                newNumber = parseInt(match[1], 10) + 1;
            }
        }
        const nextCode = 'KM' + String(newNumber).padStart(2, '0');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//get all vouchers (2) -> using async await
router.get("/vouchers", async (req, res) => {
    try {
        let vouchers = await Voucher.find({});
        res.json(vouchers);
    } catch (err) {
        res.json({ er: err.message });
    }
});

// create voucher
router.post('/vouchers', async (req, res) => {
    try {
        let { Ma_khuyen_mai } = req.body;

        if (!Ma_khuyen_mai || Ma_khuyen_mai.trim() === '') {
            const lastVoucher = await Voucher.findOne({
                Ma_khuyen_mai: /^KM\d{1,4}$/i
            }).sort({ Ma_khuyen_mai: -1 });

            let newNumber = 1;
            if (lastVoucher && lastVoucher.Ma_khuyen_mai) {
                const match = lastVoucher.Ma_khuyen_mai.match(/^KM(\d+)$/i);
                if (match) {
                    newNumber = parseInt(match[1], 10) + 1;
                }
            }
            Ma_khuyen_mai = 'KM' + String(newNumber).padStart(2, '0');
            req.body.Ma_khuyen_mai = Ma_khuyen_mai;
        }

        const existedVoucher = await Voucher.findOne({ Ma_khuyen_mai: req.body.Ma_khuyen_mai });
        if (existedVoucher) {
            return res.status(409).json({ message: 'Mã khuyến mãi đã tồn tại' });
        }

        const voucher = new Voucher(req.body);
        const savedVoucher = await voucher.save();
        res.status(201).json(savedVoucher);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// delete voucher by Ma_khuyen_mai
router.delete('/vouchers/:id', async (req, res) => {
    try {
        const deletedVoucher = await Voucher.findOneAndDelete({ Ma_khuyen_mai: req.params.id });

        if (!deletedVoucher) {
            return res.status(404).json({ message: 'Voucher không tồn tại' });
        }

        res.json({ status: 'Success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// update voucher by Ma_khuyen_mai
router.patch('/vouchers/:id', async (req, res) => {
    try {
        const voucherId = req.params.id;
        const updateData = req.body;

        const updatedVoucher = await Voucher.findOneAndUpdate(
            { Ma_khuyen_mai: voucherId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedVoucher) {
            return res.status(404).json({ message: 'Voucher không tồn tại' });
        }

        res.json(updatedVoucher);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
