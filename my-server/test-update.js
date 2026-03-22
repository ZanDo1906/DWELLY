const mongoose = require('mongoose');
const Banner = require('./models/Banner');
const db = require('./config/db');

async function testUpdate() {
  await db.connect();
  try {
    const updated = await Banner.findOneAndUpdate(
      { Trang: 'about' },
      { 
        Tieu_de: 'DWELLY - XIN CHÀO BẠN!', 
        Tieu_de_phu: 'Dữ liệu này vừa được cập nhật trực tiếp vào MongoDB để test.' 
      },
      { new: true }
    );
    console.log('Đã cập nhật banner Giới thiệu thành công!');
    console.log('Tiêu đề mới:', updated.Tieu_de);
    console.log('Tiêu đề phụ mới:', updated.Tieu_de_phu);
  } catch (e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
}
testUpdate();
