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

//get all reviews (2) -> using async await
router.get("/reviews", async (req, res) => {
    try {
            let reviews = await Review.find({});
            res.json(reviews);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
