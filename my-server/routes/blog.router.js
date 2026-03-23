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

// get next blog code
router.get("/blogs/next-code", async (req, res) => {
    try {
        const lastBlog = await Blog.findOne({
            Ma_bai_viet: /^BV\d{1,4}$/i
        }).sort({ Ma_bai_viet: -1 });
        
        let newNumber = 1;
        if (lastBlog && lastBlog.Ma_bai_viet) {
            const match = lastBlog.Ma_bai_viet.match(/^BV(\d+)$/i);
            if (match) {
                newNumber = parseInt(match[1], 10) + 1;
            }
        }
        const nextCode = 'BV' + String(newNumber).padStart(2, '0');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
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
        let { Ma_bai_viet } = req.body;

        if (!Ma_bai_viet || Ma_bai_viet.trim() === '') {
            const lastBlog = await Blog.findOne({
                Ma_bai_viet: /^BV\d{1,4}$/i
            }).sort({ Ma_bai_viet: -1 });
            
            let newNumber = 1;
            if (lastBlog && lastBlog.Ma_bai_viet) {
                const match = lastBlog.Ma_bai_viet.match(/^BV(\d+)$/i);
                if (match) {
                    newNumber = parseInt(match[1], 10) + 1;
                }
            }
            Ma_bai_viet = 'BV' + String(newNumber).padStart(2, '0');
            req.body.Ma_bai_viet = Ma_bai_viet;
        }

        const existedBlog = await Blog.findOne({ Ma_bai_viet: req.body.Ma_bai_viet });
        if (existedBlog) {
            return res.status(409).json({ message: "Mã bài viết đã tồn tại" });
        }

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
