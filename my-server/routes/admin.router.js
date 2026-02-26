const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Admin model
const Admin = require('../models/Admin');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all admins (2) -> using async await
router.get("/admins", async (req, res) => {
    try {
            let admins = await Admin.find({});
            res.json(admins);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
