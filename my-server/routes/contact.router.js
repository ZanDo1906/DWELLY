const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Contact model
const Contact = require('../models/Contact');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all contacts (2) -> using async await
router.get("/contacts", async (req, res) => {
    try {
            let contacts = await Contact.find({});
            res.json(contacts);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
