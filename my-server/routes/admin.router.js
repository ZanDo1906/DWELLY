const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

// Get admin by ID (Ma_quan_tri_vien or _id)
router.get("/admins/:id", async (req, res) => {
    try {
        let admin;
        
        // Try to find by Ma_quan_tri_vien first
        admin = await Admin.findOne({ Ma_quan_tri_vien: req.params.id });
        
        // If not found, try to find by _id (MongoDB ObjectId)
        if (!admin) {
            admin = await Admin.findById(req.params.id);
        }
        
        if (!admin) {
            return res.status(404).json({ message: "Quản trị viên không tồn tại" });
        }
        
        // Return admin info without password
        const { Mat_khau, ...adminInfo } = admin.toObject();
        res.json(adminInfo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= ADMIN LOGIN =================
router.post("/loginAdmin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu"
      });
    }

    const admin = await Admin.findOne({
      Email: { $regex: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i") }
    });

    if (!admin) {
      return res.status(400).json({
        message: "Email không tồn tại"
      });
    }

    const storedPassword = String(admin.Mat_khau || "");
    const isBcryptHash = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");

    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai mật khẩu"
      });
    }

    if (!isBcryptHash) {
      admin.Mat_khau = await bcrypt.hash(password, 10);
      await admin.save();
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
        email: admin.Email,
        avatar: admin.Anh_dai_dien || ''
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/admins/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
    }

    let admin = await Admin.findOne({ Ma_quan_tri_vien: id });
    if (!admin) {
      admin = await Admin.findById(id);
    }

    if (!admin) {
      return res.status(404).json({ message: "Quản trị viên không tồn tại" });
    }

    const storedPassword = String(admin.Mat_khau || "");
    const isBcryptHash = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");

    // Kiểm tra mật khẩu hiện tại có đúng không
    const isCurrentPasswordCorrect = isBcryptHash
      ? await bcrypt.compare(currentPassword, storedPassword)
      : currentPassword === storedPassword;

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
    const isNewPasswordSame = isBcryptHash
      ? await bcrypt.compare(newPassword, storedPassword)
      : newPassword === storedPassword;
    if (isNewPasswordSame) {
      return res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu hiện tại" });
    }

    admin.Mat_khau = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


module.exports = router;
