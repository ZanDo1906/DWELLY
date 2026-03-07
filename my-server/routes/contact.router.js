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
router.post("/contacts", async (req, res) => {
  try {

    if (!req.body.Ho_ten || !req.body.Noi_dung || !req.body.Email) {
  return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, email và nội dung' });
}

    const lastContact = await Contact
      .findOne({})
      .sort({ Ma_lien_he: -1 });

    let newId = "LH01";

    if (lastContact) {
      const lastNumber = parseInt(lastContact.Ma_lien_he.replace("LH", ""));
      newId = "LH" + String(lastNumber + 1).padStart(2, "0");
    }

    const newContact = new Contact({
      Ma_lien_he: newId,
      Ho_ten: req.body.Ho_ten,
      Email: req.body.Email || null,
      So_dien_thoai: req.body.So_dien_thoai || null,
      Noi_dung: req.body.Noi_dung,
      Trang_thai: "Chưa xử lý",
      Ma_quan_tri_vien_xu_ly: null
    });

    await newContact.save();

    res.json(newContact);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
