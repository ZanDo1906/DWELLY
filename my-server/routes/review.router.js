const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Review model
const Review = require('../models/Review');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

router.get("/reviews", async (req, res) => {
    try {
        const { productId } = req.query;
        let query = {};
        if (productId) query.Ma_san_pham = productId;
        
        let reviews = await Review.find(query);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
