const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// ================= ADMIN LOGIN =================
router.post("/loginAdmin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ Email: email });

    if (!admin) {
      return res.status(400).json({
        message: "Email không tồn tại"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.Mat_khau);

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai mật khẩu"
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      "secret_key_admin",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập admin thành công",
      token,
      admin: {
        id: admin._id,
        maAdmin: admin.Ma_quan_tri_vien,
        fullName: admin.Ho_va_ten,
        email: admin.Email
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
