const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Ranking model
const Ranking = require('../models/Ranking');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all rankings (2) -> using async await
router.get("/rankings", async (req, res) => {
    try {
            let rankings = await Ranking.find({});
            res.json(rankings);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
