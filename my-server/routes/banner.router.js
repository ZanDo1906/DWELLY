const express = require('express');
const router = express.Router();

const db = require('../config/db');
db.connect();

const Banner = require('../models/Banner');

function normalizeBannerPayload(input = {}) {
  const payload = { ...input };

  if (!payload.Tieu_de_chinh && payload.Tieu_de) {
    payload.Tieu_de_chinh = payload.Tieu_de;
  }
  if (!payload.Tieu_de && payload.Tieu_de_chinh) {
    payload.Tieu_de = payload.Tieu_de_chinh;
  }

  if (!payload.Mo_ta_ngan && payload.Mo_ta) {
    payload.Mo_ta_ngan = payload.Mo_ta;
  }
  if (!payload.Mo_ta && payload.Mo_ta_ngan) {
    payload.Mo_ta = payload.Mo_ta_ngan;
  }

  if (!payload.CTA_link && payload.Duong_dan) {
    payload.CTA_link = payload.Duong_dan;
  }
  if (!payload.Duong_dan && payload.CTA_link) {
    payload.Duong_dan = payload.CTA_link;
  }

  if (!payload.CTA_text) {
    payload.CTA_text = 'Khám phá ngay';
  }

  if (!payload.Loai_overlay) {
    payload.Loai_overlay = 'dark';
  }

  if (payload.Do_mo_overlay !== undefined) {
    payload.Do_mo_overlay = Number(payload.Do_mo_overlay);
  }

  return payload;
}

async function generateBannerCode() {
  const lastBanner = await Banner.findOne({}).sort({ Ma_banner: -1 }).lean();

  if (!lastBanner || !lastBanner.Ma_banner) {
    return 'BN01';
  }

  const currentNumber = parseInt(String(lastBanner.Ma_banner).replace(/\D/g, ''), 10);
  if (Number.isNaN(currentNumber)) {
    return 'BN01';
  }

  return `BN${String(currentNumber + 1).padStart(2, '0')}`;
}

router.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ Thu_tu: 1, Ngay_tao: -1 });
    return res.json(banners);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/api/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findOne({ Ma_banner: req.params.id });
    if (!banner) {
      return res.status(404).json({ message: 'Banner không tồn tại' });
    }

    return res.json(banner);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/api/banners', async (req, res) => {
  try {
    const payload = normalizeBannerPayload(req.body);

    if (!payload.Tieu_de_chinh || !payload.Hinh_anh || !payload.Trang) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc để tạo banner' });
    }

    if (!payload.Ma_banner) {
      payload.Ma_banner = await generateBannerCode();
    }

    payload.Thu_tu = Number(payload.Thu_tu || 0);
    payload.Trang_thai = payload.Trang_thai !== undefined ? Boolean(payload.Trang_thai) : true;
    payload.Ngay_tao = payload.Ngay_tao || new Date();
    payload.Ngay_cap_nhat = new Date();

    const createdBanner = await Banner.create(payload);
    return res.status(201).json(createdBanner);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Mã banner đã tồn tại' });
    }
    return res.status(400).json({ message: err.message });
  }
});

router.patch('/api/banners/:id', async (req, res) => {
  try {
    const updateData = { ...normalizeBannerPayload(req.body), Ngay_cap_nhat: new Date() };

    if (updateData.Thu_tu !== undefined) {
      updateData.Thu_tu = Number(updateData.Thu_tu);
    }

    const updatedBanner = await Banner.findOneAndUpdate(
      { Ma_banner: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ message: 'Banner không tồn tại' });
    }

    return res.json(updatedBanner);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete('/api/banners/:id', async (req, res) => {
  try {
    const deletedBanner = await Banner.findOneAndDelete({ Ma_banner: req.params.id });

    if (!deletedBanner) {
      return res.status(404).json({ message: 'Banner không tồn tại' });
    }

    return res.json({ message: 'Đã xóa banner thành công', banner: deletedBanner });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/api/banners/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: 'ids phải là mảng và không được rỗng' });
    }

    const deleteResult = await Banner.deleteMany({ Ma_banner: { $in: ids } });
    return res.json({ deletedCount: deleteResult.deletedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;