const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Category model
const Category = require('../models/Category');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

// get all categories
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get category by Ma_danh_muc
router.get("/categories/:id", async (req, res) => {
    try {
        const category = await Category.findOne({ Ma_danh_muc: req.params.id });
        if (!category) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create category
router.post("/categories", async (req, res) => {
    try {
        const { Ma_danh_muc } = req.body;

        if (!Ma_danh_muc) {
            return res.status(400).json({ message: "Thiếu Ma_danh_muc" });
        }

        const existedCategory = await Category.findOne({ Ma_danh_muc });
        if (existedCategory) {
            return res.status(409).json({ message: "Mã danh mục đã tồn tại" });
        }

        const category = new Category(req.body);
        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// update category by Ma_danh_muc
router.patch("/categories/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const updateData = { ...req.body, updatedAt: new Date() };

        if (updateData.Ma_danh_muc && updateData.Ma_danh_muc !== categoryId) {
            const existedCategory = await Category.findOne({ Ma_danh_muc: updateData.Ma_danh_muc });
            if (existedCategory) {
                return res.status(409).json({ message: "Mã danh mục mới đã tồn tại" });
            }
        }

        const updatedCategory = await Category.findOneAndUpdate(
            { Ma_danh_muc: categoryId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }

        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// delete category by Ma_danh_muc
router.delete("/categories/:id", async (req, res) => {
    try {
        const deletedCategory = await Category.findOneAndDelete({ Ma_danh_muc: req.params.id });

        if (!deletedCategory) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }

        res.json({ message: "Đã xóa danh mục thành công", category: deletedCategory });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;