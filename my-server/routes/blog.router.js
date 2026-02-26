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

module.exports = router;
