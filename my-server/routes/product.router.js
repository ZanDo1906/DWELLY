const express = require('express');
const router = express.Router();
const fs = require('fs');

// API lấy mã sản phẩm tiếp theo
router.get('/products/next-code', async (req, res, next) => {
  try {
    const lastProduct = await Product.findOne({}).sort({ Ma_san_pham: -1 });
    let newNumber = 1;
    if (lastProduct && lastProduct.Ma_san_pham) {
      const match = lastProduct.Ma_san_pham.match(/^(\d+)$/);
      if (match) {
        newNumber = parseInt(match[1], 10) + 1;
      }
    }
    const nextCode = String(newNumber).padStart(2, '0');
    res.json({ nextCode });
  } catch (err) {
    next(err);
  }
});
const path = require('path');
const Product = require('../models/Product');
const upload = require('../upload');

//GET all products
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

//GET product by code
router.get('/products/:code', async (req, res, next) => {
  try {
    const product = await Product.findOne({ Ma_san_pham: req.params.code });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/products/by-codes', async (req, res, next) => {
  try {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes)) {
      return res.status(400).json({ message: "codes phải là array" });
    }

    const products = await Product.find({
      Ma_san_pham: { $in: codes }
    });

    res.json(products);

  } catch (err) {
    next(err);
  }
});

//POST product
router.post('/products', async (req, res, next) => {
  try {
    // Nếu không có mã sản phẩm truyền lên, tự động sinh mã mới dạng số tăng dần (01, 02, ...)
    let maSanPham = req.body.Ma_san_pham;
    if (!maSanPham || maSanPham.trim() === '') {
      // Lấy mã lớn nhất hiện tại (dạng số)
      const lastProduct = await Product.findOne({}).sort({ Ma_san_pham: -1 });
      let newNumber = 1;
      if (lastProduct && lastProduct.Ma_san_pham) {
        // Nếu mã là số, tăng tiếp
        const match = lastProduct.Ma_san_pham.match(/^(\d+)$/);
        if (match) {
          newNumber = parseInt(match[1], 10) + 1;
        }
      }
      maSanPham = String(newNumber).padStart(2, '0');
      req.body.Ma_san_pham = maSanPham;
    }
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

//PATCH product
router.patch('/products/:code', async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { Ma_san_pham: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

//UPLOAD images 
router.post('/products/:code/images', upload.array('images', 10), async (req, res, next) => {
  try {
    const product = await Product.findOne({ Ma_san_pham: req.params.code });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    
    const records = (req.files || []).map(f => `/uploads/products/${f.filename}`);

    product.Hinh_anh.push(...records);
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

//DELETE 
router.delete('/products/:code', async (req, res, next) => {
  try {
    const product = await Product.findOne({ Ma_san_pham: req.params.code });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    for (const url of product.Hinh_anh) {
      const filename = path.basename(url); 
      const full = path.join(process.cwd(), uploadDir, 'products', filename);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

// DELETE một ảnh cụ thể của sản phẩm (xóa trong máy và xóa URL trong DB)
router.delete('/products/:code/images/:filename', async (req, res, next) => {
  try {
    const product = await Product.findOne({ Ma_san_pham: req.params.code });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const filename = req.params.filename;

    // Dùng split('/').pop() thay vì path.basename() để tránh lỗi Windows
    const existsInDb = product.Hinh_anh.some(url => url.split('/').pop() === filename);
    if (!existsInDb) {
      return res.status(404).json({ message: 'Ảnh không tồn tại trong sản phẩm này' });
    }

    product.Hinh_anh = product.Hinh_anh.filter(url => url.split('/').pop() !== filename);

    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const fullPath = path.join(process.cwd(), uploadDir, 'products', filename);
    
    console.log('Đang xóa file:', fullPath); // log để kiểm tra path
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('Xóa file thành công');
    } else {
      console.log('File không tồn tại:', fullPath);
    }

    await product.save();
    res.json({ message: 'Ảnh đã được xóa', remainingImages: product.Hinh_anh });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
