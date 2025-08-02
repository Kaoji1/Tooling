// upload.controller.js
const fs = require('fs');
const path = require('path');

// โฟลเดอร์ปลายทางที่ต้องการอัปโหลด (network path)
const BASE_UPLOAD_DIR = '\\\\pbp083\\Project\\Cost Reduction\\Program requset indirecnt';


// ฟังก์ชันนี้จะถูกใช้หลัง multer ทำงานแล้ว (req.file พร้อมใช้งาน)
exports.FileUpload = async (req, res) => {
  try {
    // 1. ตรวจสอบว่าไฟล์ถูกส่งมาจริง
    if (!req.formdata) {
      return res.status(400).json({ error: 'ไม่มีไฟล์ถูกอัปโหลด' });
    }

    const file = req.file; // multer เพิ่ม req.file เข้ามาให้

    // 2. ตั้งชื่อไฟล์ใหม่
    const saveName = `${Date.now()}-${file.originalname}`;

    // 3. สร้าง path ปลายทาง
    const savePath = path.join(BASE_UPLOAD_DIR, saveName);

    // 4. ย้ายไฟล์จาก tmp path ของ multer → ไปยัง network path
    fs.renameSync(file.path, savePath); // ใช้ renameSync เพื่อย้ายไฟล์

    // 5. ส่งผลกลับ
    return res.json({
      success: true,
      filename: saveName,
      path: savePath
    });
  } catch (err) {
    console.error(' Upload error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดขณะอัปโหลด' });
  }
};