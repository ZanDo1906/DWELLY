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

router.get("/concepts", async (req, res) => {
  try {
    const concepts = await Concept.find(); // Lấy tất cả concept từ DB
    res.json(concepts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/concepts/:id", async (req, res) => {
  try {
    const concept = await Concept.findOne({ Ma_khong_gian: req.params.id });
    if (!concept) return res.status(404).json({ message: "Không tìm thấy concept" });
    res.json(concept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
