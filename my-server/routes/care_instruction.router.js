const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Care Instruction model
const Care_Instruction = require('../models/Care_Instruction');

//Define API

router.get("/care_instructions/category/:categoryId", async (req, res) => {
    try {
        const instruction = await Care_Instruction.findOne({ 
            Ma_danh_muc: { $in: [req.params.categoryId] }  
        });
        if (!instruction) {
            return res.status(404).json({ message: "Không tìm thấy hướng dẫn cho danh mục này" });
        }
        res.json(instruction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
