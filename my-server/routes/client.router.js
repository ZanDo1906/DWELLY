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


router.get("/clients/favorite-count/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const count = await Client.countDocuments({ favorites: productId });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/clients/toggle-favorite", async (req, res) => {
  try {
    const { customerCode, productId } = req.body;

    const client = await Client.findOne({ Ma_khach_hang: customerCode });

    if (!client) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    let favorites = client.favorites || [];

    if (favorites.includes(productId)) {
      favorites = favorites.filter(p => p !== productId);
    } else {
      favorites.push(productId);
    }

    client.favorites = favorites;
    await client.save();

    const favoritesCount = await Client.countDocuments({
      favorites: productId
    });

    res.json({
      favorites,
      favoritesCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get client by ID
router.get("/clients/:id", async (req, res) => {
    try {
        let  client = await Client.findOne({ Ma_khach_hang: req.params.id });
        if (!client) {
            return res.status(404).json({ message: "Khách hàng không tồn tại" });
        }
        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// update client info
router.patch("/clients/:id", async (req, res) => {
    try {
        const client = await Client.findOne({ Ma_khach_hang: req.params.id });

        if (!client) {
            return res.status(404).json({ message: "Khách hàng không tồn tại" });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (req.body.Ho_va_ten !== undefined) updateData.Ho_va_ten = req.body.Ho_va_ten;
        if (req.body.So_dien_thoai !== undefined) updateData.So_dien_thoai = req.body.So_dien_thoai;
        if (req.body.Email !== undefined) updateData.Email = req.body.Email;
        if (req.body.Anh_dai_dien !== undefined) updateData.Anh_dai_dien = req.body.Anh_dai_dien;

        const updatedClient = await Client.findOneAndUpdate(
            { Ma_khach_hang: req.params.id },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        res.json({ message: "Cập nhật thông tin thành công", client: updatedClient });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        email: user.Email,
        favorites: user.favorites || []

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
