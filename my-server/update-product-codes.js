// Script cập nhật mã sản phẩm về dạng SPxxx cho đồng bộ
// Chạy script này bằng: node update-product-codes.js

const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO_URL = process.env.DB_URL || 'mongodb://localhost:27017/dwelly';

async function run() {
  await mongoose.connect(MONGO_URL);
  const products = await Product.find({});
  let changed = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    // Nếu mã đã đúng dạng SPxxx thì bỏ qua
    if (/^SP\d{3}$/.test(p.Ma_san_pham)) continue;
    // Nếu mã là số, chuyển về SPxxx
    const num = parseInt(p.Ma_san_pham, 10);
    if (!isNaN(num)) {
      const newCode = 'SP' + String(num).padStart(3, '0');
      await Product.updateOne({ _id: p._id }, { Ma_san_pham: newCode });
      changed++;
      console.log(`${p.Ma_san_pham} => ${newCode}`);
    }
  }
  console.log(`Đã cập nhật ${changed} sản phẩm.`);
  await mongoose.disconnect();
}

run().catch(console.error);