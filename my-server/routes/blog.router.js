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

// get blog by business id (Ma_bai_viet)
router.get("/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findOne({ Ma_bai_viet: id });

        if (!blog) {
            return res.status(404).json({ er: 'Blog not found' });
        }

        return res.json(blog);
    } catch (err) {
        return res.status(500).json({ er: err.message });
    }
});

module.exports = router;
