const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Concept model
const Concept = require('../models/Concept');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all concepts (2) -> using async await
router.get("/concepts", async (req, res) => {
    try {
            let concepts = await Concept.find({});
            res.json(concepts);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
