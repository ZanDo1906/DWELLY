const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Client model
const Client = require('../models/Client');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all clients (2) -> using async await
router.get("/clients", async (req, res) => {
    try {
            let clients = await Client.find({});
            res.json(clients);
    }catch (err) {
        res.json({er: err.message});
    }
});

module.exports = router;
