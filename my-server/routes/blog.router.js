const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Blog model
const Blog = require('../models/Blog');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all blogs (2) -> using async await
router.get("/blogs", async (req, res) => {
    try {
            let blogs = await Blog.find({});
            res.json(blogs);
    }catch (err) {
        res.json({er: err.message});
    }
});

router.get("/blogs/:id", async (req, res) => {
    try {
        let  blog = await Blog.findOne({ Ma_bai_viet: req.params.id });
        if (!blog) {
            return res.status(404).json({ message: "Bài viết không tồn tại" });
        }
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new blog
router.post("/blogs", async (req, res) => {
    try {
        const newBlog = new Blog({
            Ma_bai_viet: req.body.Ma_bai_viet,
            Tieu_de: req.body.Tieu_de,
            Tom_tat: req.body.Tom_tat,
            Noi_dung: req.body.Noi_dung,
            Hinh_anh: req.body.Hinh_anh,
            Trang_thai: req.body.Trang_thai,
            Ngay_tao: req.body.Ngay_tao || new Date(),
            Ma_quan_tri_vien: req.body.Ma_quan_tri_vien
        });
        
        const savedBlog = await newBlog.save();
        res.status(201).json(savedBlog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update blog (partial update) - works for both full update and status update
router.patch("/blogs/:id", async (req, res) => {
    try {
        const updateData = { ...req.body, updatedAt: new Date() };
        
        const updatedBlog = await Blog.findOneAndUpdate(
            { Ma_bai_viet: req.params.id },
            updateData,
            { new: true }
        );
        
        if (!updatedBlog) {
            return res.status(404).json({ message: "Bài viết không tồn tại" });
        }
        
        res.json(updatedBlog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete blog
router.delete("/blogs/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findOneAndDelete({ Ma_bai_viet: req.params.id });
        
        if (!deletedBlog) {
            return res.status(404).json({ message: "Bài viết không tồn tại" });
        }
        
        res.json({ message: "Đã xóa bài viết thành công", blog: deletedBlog });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
