const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Client model
const Client = require('../models/Client');

function normalizePhone(phone) {
  return String(phone || '').trim().replace(/\s+/g, '');
}

function isValidPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  const isValidFormat = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalizedPhone);

  if (!isValidFormat) {
    return false;
  }

  const digitsOnly = normalizedPhone.startsWith('+84')
    ? `0${normalizedPhone.slice(3)}`
    : normalizedPhone;

  const subscriberDigits = digitsOnly.slice(-8);
  const isRepeatedSubscriber = /^([0-9])\1{7}$/.test(subscriberDigits);
  const isAscendingSequence = digitsOnly === '0123456789';
  const isDescendingSequence = digitsOnly === '0987654321';

  return !(isRepeatedSubscriber || isAscendingSequence || isDescendingSequence);
}

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
    if (req.body.Ho_va_ten !== undefined) {
      updateData.Ho_va_ten = String(req.body.Ho_va_ten).trim();
    }

    if (req.body.So_dien_thoai !== undefined) {
      const normalizedPhone = normalizePhone(req.body.So_dien_thoai);

      if (!isValidPhone(normalizedPhone)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
      }

      const duplicatedPhone = await Client.findOne({
        So_dien_thoai: normalizedPhone,
        Ma_khach_hang: { $ne: req.params.id }
      });

      if (duplicatedPhone) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
      }

      updateData.So_dien_thoai = normalizedPhone;
    }

    if (req.body.Anh_dai_dien !== undefined) updateData.Anh_dai_dien = req.body.Anh_dai_dien;

    const shouldSyncAddressOwnerInfo =
      (updateData.Ho_va_ten !== undefined || updateData.So_dien_thoai !== undefined);

    if (shouldSyncAddressOwnerInfo) {
      const oldName = String(client.Ho_va_ten || '').trim();
      const oldPhone = normalizePhone(client.So_dien_thoai || '');
      const newName = updateData.Ho_va_ten !== undefined ? updateData.Ho_va_ten : oldName;
      const newPhone = updateData.So_dien_thoai !== undefined ? updateData.So_dien_thoai : oldPhone;

      const syncOwnerInfoForAddressList = (addressList) => {
        if (!Array.isArray(addressList)) {
          return addressList;
        }

        return addressList.map((addressItem) => {
          if (!addressItem || typeof addressItem !== 'object') {
            return addressItem;
          }

          const currentName = String(addressItem.FullName || addressItem.fullName || '').trim();
          const currentPhone = normalizePhone(addressItem.Phone || addressItem.phone || '');

          const isOwnerAddress =
            (!currentName && !currentPhone)
            || (oldName && currentName === oldName)
            || (oldPhone && currentPhone === oldPhone)
            || Boolean(addressItem.IsDefault);

          if (!isOwnerAddress) {
            return addressItem;
          }

          return {
            ...addressItem,
            ...(updateData.Ho_va_ten !== undefined ? { FullName: newName } : {}),
            ...(updateData.So_dien_thoai !== undefined ? { Phone: newPhone } : {}),
          };
        });
      };

      updateData.Dia_chi = syncOwnerInfoForAddressList(client.Dia_chi);

      if (Array.isArray(client.Addresses)) {
        updateData.Addresses = syncOwnerInfoForAddressList(client.Addresses);
      }
    }

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

// ================== CHANGE PASSWORD ==================
router.patch("/clients/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const client = await Client.findOne({ Ma_khach_hang: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    }

    const isCurrentPasswordMatched = await bcrypt.compare(currentPassword, client.Mat_khau);

    if (!isCurrentPasswordMatched) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, client.Mat_khau);
    if (isSamePassword) {
      return res.status(400).json({ message: "Mật khẩu mới không được trùng mật khẩu cũ" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await Client.findOneAndUpdate(
      { Ma_khach_hang: req.params.id },
      { $set: { Mat_khau: hashedNewPassword, updatedAt: new Date() } }
    );

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//==============GET ADDRESS ================
const buildAddressText = (address) => {
  return [address.DetailAddress, address.Ward, address.District, address.Province]
    .filter(Boolean)
    .join(', ')
    .trim();
};

const toStructuredAddress = (item, fallbackName = '', fallbackPhone = '') => {
  if (!item) return null;

  if (typeof item === 'string') {
    const fullAddress = item.trim();
    if (!fullAddress) return null;

    return {
      FullName: fallbackName,
      Phone: fallbackPhone,
      Province: '',
      District: '',
      Ward: '',
      DetailAddress: fullAddress,
      IsDefault: false
    };
  }

  if (typeof item === 'object') {
    const mapped = {
      FullName: String(item.FullName || item.fullName || fallbackName || '').trim(),
      Phone: String(item.Phone || item.phone || fallbackPhone || '').trim(),
      Province: String(item.Province || item.province || '').trim(),
      District: String(item.District || item.district || '').trim(),
      Ward: String(item.Ward || item.ward || '').trim(),
      DetailAddress: String(item.DetailAddress || item.address || item.dia_chi || '').trim(),
      IsDefault: Boolean(item.IsDefault)
    };

    if (!mapped.DetailAddress) {
      return null;
    }

    return mapped;
  }

  return null;
};

router.get("/clients/:id/address", async (req, res) => {
  try {
    const client = await Client.findOne({ Ma_khach_hang: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    }

    const legacyDiaChi = Array.isArray(client.Dia_chi)
      ? client.Dia_chi
      : (client.Dia_chi ? [client.Dia_chi] : []);

    const addressesFromDiaChi = legacyDiaChi
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const addressesFromOldField = (Array.isArray(client.Addresses) ? client.Addresses : [])
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const dedupMap = new Map();
    [...addressesFromDiaChi, ...addressesFromOldField].forEach((addr) => {
      const key = `${buildAddressText(addr).toLowerCase()}|${String(addr.Phone || '').toLowerCase()}|${String(addr.FullName || '').toLowerCase()}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, addr);
      }
    });

    const unifiedAddresses = Array.from(dedupMap.values());

    if (Array.isArray(client.Addresses) && client.Addresses.length > 0) {
      await Client.updateOne(
        { Ma_khach_hang: req.params.id },
        {
          $set: { Dia_chi: unifiedAddresses, updatedAt: new Date() },
          $unset: { Addresses: "" }
        }
      );
    }

    res.json({ address: unifiedAddresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//==============ADD ADDRESS ================
router.post("/clients/:id/address", async (req, res) => {
  try {
    const client = await Client.findOne({ Ma_khach_hang: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    }

    const {
      FullName,
      Phone,
      Province,
      District,
      Ward,
      DetailAddress,
      IsDefault
    } = req.body;

    if (!FullName || !Phone || !DetailAddress) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin địa chỉ" });
    }

    const normalizedPhone = normalizePhone(Phone);
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    const existingDiaChi = Array.isArray(client.Dia_chi)
      ? client.Dia_chi
      : (client.Dia_chi ? [client.Dia_chi] : []);

    const existingStructuredAddresses = existingDiaChi
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const addressesFromOldField = (Array.isArray(client.Addresses) ? client.Addresses : [])
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const mergedAddresses = [...existingStructuredAddresses, ...addressesFromOldField];

    const shouldForceDefault = mergedAddresses.length === 0;
    const nextIsDefault = shouldForceDefault ? true : Boolean(IsDefault);

    if (nextIsDefault) {
      mergedAddresses.forEach((addr) => {
        addr.IsDefault = false;
      });
    }

    const newAddress = {
      FullName: String(FullName).trim(),
      Phone: normalizedPhone,
      Province: String(Province || '').trim(),
      District: String(District || '').trim(),
      Ward: String(Ward || '').trim(),
      DetailAddress: String(DetailAddress).trim(),
      IsDefault: nextIsDefault
    };

    mergedAddresses.push(newAddress);

    await Client.updateOne(
      { Ma_khach_hang: req.params.id },
      {
        $set: {
          Dia_chi: mergedAddresses,
          updatedAt: new Date()
        },
        $unset: {
          Addresses: ""
        }
      }
    );

    res.json({ message: "Thêm địa chỉ thành công", address: newAddress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//==============UPDATE ADDRESS ================
router.patch("/clients/:id/address/:index", async (req, res) => {
  try {
    const client = await Client.findOne({ Ma_khach_hang: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    }

    const addressIndex = Number(req.params.index);
    if (!Number.isInteger(addressIndex) || addressIndex < 0) {
      return res.status(400).json({ message: "Chỉ số địa chỉ không hợp lệ" });
    }

    const {
      FullName,
      Phone,
      Province,
      District,
      Ward,
      DetailAddress,
      IsDefault
    } = req.body;

    if (!FullName || !Phone || !DetailAddress) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin địa chỉ" });
    }

    const normalizedPhone = normalizePhone(Phone);
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    const legacyDiaChi = Array.isArray(client.Dia_chi)
      ? client.Dia_chi
      : (client.Dia_chi ? [client.Dia_chi] : []);

    const addressesFromDiaChi = legacyDiaChi
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const addressesFromOldField = (Array.isArray(client.Addresses) ? client.Addresses : [])
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const dedupMap = new Map();
    [...addressesFromDiaChi, ...addressesFromOldField].forEach((addr) => {
      const key = `${buildAddressText(addr).toLowerCase()}|${String(addr.Phone || '').toLowerCase()}|${String(addr.FullName || '').toLowerCase()}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, addr);
      }
    });

    const unifiedAddresses = Array.from(dedupMap.values());

    if (addressIndex >= unifiedAddresses.length) {
      return res.status(404).json({ message: "Địa chỉ không tồn tại" });
    }

    const currentAddress = unifiedAddresses[addressIndex];
    const requestedIsDefault = Boolean(IsDefault);
    const isUnsettingCurrentDefault = Boolean(currentAddress?.IsDefault) && !requestedIsDefault;

    if (isUnsettingCurrentDefault) {
      const hasAnotherDefault = unifiedAddresses.some((addr, idx) => idx !== addressIndex && Boolean(addr?.IsDefault));
      if (!hasAnotherDefault) {
        return res.status(400).json({ message: "Không thể bỏ mặc định vì danh sách sẽ không còn địa chỉ mặc định" });
      }
    }

    if (requestedIsDefault) {
      unifiedAddresses.forEach((addr) => {
        addr.IsDefault = false;
      });
    }

    unifiedAddresses[addressIndex] = {
      FullName: String(FullName).trim(),
      Phone: normalizedPhone,
      Province: String(Province || '').trim(),
      District: String(District || '').trim(),
      Ward: String(Ward || '').trim(),
      DetailAddress: String(DetailAddress).trim(),
      IsDefault: requestedIsDefault
    };

    await Client.updateOne(
      { Ma_khach_hang: req.params.id },
      {
        $set: {
          Dia_chi: unifiedAddresses,
          updatedAt: new Date()
        },
        $unset: {
          Addresses: ""
        }
      }
    );

    res.json({ message: "Cập nhật địa chỉ thành công", address: unifiedAddresses[addressIndex] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//==============DELETE ADDRESS ================
router.delete("/clients/:id/address/:index", async (req, res) => {
  try {
    const client = await Client.findOne({ Ma_khach_hang: req.params.id });

    if (!client) {
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    }

    const addressIndex = Number(req.params.index);
    if (!Number.isInteger(addressIndex) || addressIndex < 0) {
      return res.status(400).json({ message: "Chỉ số địa chỉ không hợp lệ" });
    }

    const legacyDiaChi = Array.isArray(client.Dia_chi)
      ? client.Dia_chi
      : (client.Dia_chi ? [client.Dia_chi] : []);

    const addressesFromDiaChi = legacyDiaChi
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const addressesFromOldField = (Array.isArray(client.Addresses) ? client.Addresses : [])
      .map((item) => toStructuredAddress(item, client.Ho_va_ten, client.So_dien_thoai))
      .filter(Boolean);

    const dedupMap = new Map();
    [...addressesFromDiaChi, ...addressesFromOldField].forEach((addr) => {
      const key = `${buildAddressText(addr).toLowerCase()}|${String(addr.Phone || '').toLowerCase()}|${String(addr.FullName || '').toLowerCase()}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, addr);
      }
    });

    const unifiedAddresses = Array.from(dedupMap.values());

    if (addressIndex >= unifiedAddresses.length) {
      return res.status(404).json({ message: "Địa chỉ không tồn tại" });
    }

    const removedAddress = unifiedAddresses[addressIndex];
    unifiedAddresses.splice(addressIndex, 1);

    const removedWasDefault = Boolean(removedAddress?.IsDefault);
    if (removedWasDefault && unifiedAddresses.length > 0) {
      const stillHasDefault = unifiedAddresses.some((addr) => Boolean(addr?.IsDefault));
      if (!stillHasDefault) {
        unifiedAddresses[0].IsDefault = true;
      }
    }

    await Client.updateOne(
      { Ma_khach_hang: req.params.id },
      {
        $set: {
          Dia_chi: unifiedAddresses,
          updatedAt: new Date()
        },
        $unset: {
          Addresses: ""
        }
      }
    );

    res.json({ message: "Xóa địa chỉ thành công" });
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
    const normalizedPhone = normalizePhone(phone);

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ"
      });
    }

    const existing = await Client.findOne({
      $or: [{ Email: email }, { So_dien_thoai: normalizedPhone }]
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
      So_dien_thoai: normalizedPhone,
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
