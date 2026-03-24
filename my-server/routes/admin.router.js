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

// ================= FORGOT PASSWORD - STEP 1: VERIFY EMAIL/PHONE & SEND OTP =================
// In-memory storage for OTP (in production, use Redis or database)
const otpStorage = {};
const OTP_EXPIRY = 3 * 60 * 1000; // 3 minutes

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/forgot-password", async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    const normalizedInput = String(emailOrPhone || "").trim();

    if (!normalizedInput) {
      return res.status(400).json({
        message: "Vui lòng nhập Email hoặc Số điện thoại"
      });
    }

    // Find admin by email or phone
    let admin = await Admin.findOne({
      $or: [
        { Email: { $regex: new RegExp(`^${escapeRegExp(normalizedInput)}$`, "i") } },
        { So_dien_thoai: normalizedInput }
      ]
    });

    if (!admin) {
      return res.status(404).json({
        message: "Email hoặc Số điện thoại không tồn tại trong hệ thống"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const adminId = admin._id.toString();
    
    // Store OTP in memory with expiry
    otpStorage[adminId] = {
      otp: otp,
      contact: normalizedInput,
      createdAt: Date.now(),
      attempts: 0
    };

    // Auto-delete OTP after expiry
    setTimeout(() => {
      delete otpStorage[adminId];
    }, OTP_EXPIRY);

    // Log OTP to console for development
    console.log(`\n========== OTP FOR ${normalizedInput} ==========`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires in: ${OTP_EXPIRY / 1000} seconds`);
    console.log(`========== END OTP ==========\n`);

    res.json({
      message: "Đã gửi mã xác thực",
      adminId: adminId,
      maskedContact: maskContact(normalizedInput),
      otp: otp
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function maskContact(contact) {
  if (contact.includes('@')) {
    // Mask email
    const [name, domain] = contact.split('@');
    return name.substring(0, 2) + '***@' + domain;
  } else {
    // Mask phone
    return contact.substring(0, 4) + '****' + contact.substring(8);
  }
}

// ================= FORGOT PASSWORD - STEP 2: VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { adminId, otp } = req.body;

    if (!adminId || !otp) {
      return res.status(400).json({
        message: "Vui lòng nhập mã xác thực"
      });
    }

    const otpData = otpStorage[adminId];

    if (!otpData) {
      return res.status(400).json({
        message: "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới"
      });
    }

    if (Date.now() - otpData.createdAt > OTP_EXPIRY) {
      delete otpStorage[adminId];
      return res.status(400).json({
        message: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới"
      });
    }

    if (otpData.attempts >= 5) {
      delete otpStorage[adminId];
      return res.status(429).json({
        message: "Quá nhiều lần nhập sai. Vui lòng yêu cầu mã xác thực mới"
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts++;
      return res.status(400).json({
        message: "Mã xác thực không chính xác"
      });
    }

    // OTP is correct - user can now reset password
    res.json({
      message: "Xác thực thành công",
      adminId: adminId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= FORGOT PASSWORD - STEP 3: RESET PASSWORD =================
router.patch("/admins/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu mới"
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        message: "Quản trị viên không tồn tại"
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, admin.Mat_khau);
    if (isSamePassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng mật khẩu cũ"
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await Admin.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          Mat_khau: hashedNewPassword, 
          updatedAt: new Date() 
        } 
      }
    );

    // Clear OTP data after successful reset
    delete otpStorage[req.params.id];

    res.json({
      message: "Đặt lại mật khẩu thành công"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
