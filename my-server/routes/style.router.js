const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Style model
const Style = require('../models/Style');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

// get all styles
router.get("/styles", async (req, res) => {
    try {
        const styles = await Style.find({});
        res.json(styles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get style by Ma_phong_cach
router.get("/styles/:id", async (req, res) => {
    try {
        const style = await Style.findOne({ Ma_phong_cach: req.params.id });
        if (!style) {
            return res.status(404).json({ message: "Phong cách không tồn tại" });
        }
        res.json(style);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create style
router.post("/styles", async (req, res) => {
    try {
        const { Ma_phong_cach } = req.body;

        if (!Ma_phong_cach) {
            return res.status(400).json({ message: "Thiếu Ma_phong_cach" });
        }

        const existedStyle = await Style.findOne({ Ma_phong_cach });
        if (existedStyle) {
            return res.status(409).json({ message: "Mã phong cách đã tồn tại" });
        }

        const style = new Style(req.body);
        const savedStyle = await style.save();
        res.status(201).json(savedStyle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// update style by Ma_phong_cach
router.patch("/styles/:id", async (req, res) => {
    try {
        const styleId = req.params.id;
        const updateData = { ...req.body, updatedAt: new Date() };

        if (updateData.Ma_phong_cach && updateData.Ma_phong_cach !== styleId) {
            const existedStyle = await Style.findOne({ Ma_phong_cach: updateData.Ma_phong_cach });
            if (existedStyle) {
                return res.status(409).json({ message: "Mã phong cách mới đã tồn tại" });
            }
        }

        const updatedStyle = await Style.findOneAndUpdate(
            { Ma_phong_cach: styleId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedStyle) {
            return res.status(404).json({ message: "Phong cách không tồn tại" });
        }

        res.json(updatedStyle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// delete style by Ma_phong_cach
router.delete("/styles/:id", async (req, res) => {
    try {
        const deletedStyle = await Style.findOneAndDelete({ Ma_phong_cach: req.params.id });

        if (!deletedStyle) {
            return res.status(404).json({ message: "Phong cách không tồn tại" });
        }

        res.json({ message: "Đã xóa phong cách thành công", style: deletedStyle });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
