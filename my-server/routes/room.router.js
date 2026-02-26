const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Room model
const Room = require('../models/Room');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all rooms (2) -> using async await
router.get("/rooms", async (req, res) => {
    try {
            let rooms = await Room.find({});
            res.json(rooms);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
