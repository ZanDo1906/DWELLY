const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Client.findOne({ Email: email });

    if (!user) {
      return res.status(400).json({
        message: "Email không tồn tại"
      });
    }

    const isMatch = await bcrypt.compare(password, user.Mat_khau);

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai mật khẩu"
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.Email },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        customerCode: user.Ma_khach_hang,
        fullName: user.Ho_va_ten,
        email: user.Email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//====================== REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const existing = await Client.findOne({
      $or: [{ Email: email }, { So_dien_thoai: phone }]
    });

    if (existing) {
      return res.status(400).json({
        message: "Email hoặc Số điện thoại đã tồn tại"
      });
    }

    // 🔥 Lấy mã lớn nhất hiện tại
    const clients = await Client.find({});
    
    let maxNumber = 0;

    clients.forEach(c => {
      const num = parseInt(c.Ma_khach_hang.replace('C', ''));
      if (num > maxNumber) {
        maxNumber = num;
      }
    });

    const nextNumber = maxNumber + 1;
    const newCode = "C" + String(nextNumber).padStart(2, '0');

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new Client({
      Ma_khach_hang: newCode,
      Ho_va_ten: name,
      So_dien_thoai: phone,
      Email: email,
      Mat_khau: hashed,
      Trang_thai: true,
      Ngay_tao: new Date(),
      Ma_phan_hang: "DONG",
      Tong_diem: 0,
      favorites: []
    });

    await newUser.save();

    res.status(201).json({
      message: "Đăng ký thành công"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
