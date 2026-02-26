const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Care Instruction model
const Care_Instruction = require('../models/Care_Instruction');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all care instructions (2) -> using async await
router.get("/care_instructions", async (req, res) => {
    try {
            let care_instructions = await Care_Instruction.find({});
            res.json(care_instructions);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
