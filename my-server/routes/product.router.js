const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Product model
const Product = require('../models/Product');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});


//get all products (1) -> using Promise then/catch
router.get("/products", (req, res) => {
    //Fetch data from MongoDB
    Product.find({})
    .then(data => res.json(data))
    .catch(err => res.status(500).json({error: err.message}));
});

//get all products (2) -> using async await
router.get("/allproducts", async (req, res) => {
    try {
            let products = await Product.find({});
            res.json(products);
    }catch (err) {
        res.json({er: err.message});
    }
});

//get product by id
router.get("/products/:id", async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        res.json(product);
    } catch (err) {
        res.json({message: err.message});
    }
});


//post product
router.post("/product", async (req, res) => {
    console.log(req.body);
    const p = new Product({
        name: req.body.name,
        price: req.body.price,
    });

    try{
        const savedProduct = await p.save();
        res.json({ status: "Success", product: savedProduct });
    }catch (err){
        res.json({message: err.message});
    }
    
    
});

//========UPDTAE=========

router.patch('/products/:id', async (req, res) => {
    try {
        await Product.updateOne(
            { _id: req.params.id },
            { $set: { name: req.body.name, price: req.body.price } },
        );
        res.json({ status: "Success" });
    } catch (err) {
        res.json({ message: err.message });
    }
});

//========DELETE=========
router.delete('/products/:id', async (req, res) => {
    try {
        await Product.deleteOne({ _id: req.params.id });
        res.json({ status: "Success" });
    }catch (err) {
        res.json({ message: err.message });
    }
});

module.exports = router;