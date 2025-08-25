// src/controllers/FileRead.controller.js
const fs = require('fs');

exports.loadPdfFromPath = (req, res) => {
  const filePath = req.body.filePath; // รับ path จาก Angular

  if (!filePath) {
    return res.status(400).json({ error: 'ต้องระบุ path ของไฟล์' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ไม่พบไฟล์ PDF' });
  }

  // ส่งไฟล์เป็น PDF binary
  res.contentType('application/pdf');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};
