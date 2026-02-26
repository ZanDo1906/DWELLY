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

//get all styles (2) -> using async await
router.get("/styles", async (req, res) => {
    try {
            let styles = await Style.find({});
            res.json(styles);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
