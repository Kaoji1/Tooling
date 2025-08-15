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



// // src/controllers/FileRead.controller.js
// const fs = require('fs');
// const path = require('path');
// const sql = require("mssql");
// const { poolPromise } = require("../config/database");

// exports.loadPdfFromPath = async (req, res) => {
//   try {
//     const caseKey = req.body.caseKey;
//     if (!caseKey) return res.status(400).json({ error: 'ต้องระบุ caseKey' });

//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input('CASE', sql.NVarChar(50), caseKey)
//       .query(`SELECT TOP 1 FilePath FROM tb_IssueCuttingTool_Request_Document WHERE [CASE] = @CASE AND FilePath IS NOT NULL`);

//     if (result.recordset.length === 0) return res.status(404).json({ error: 'ไม่พบ path ของไฟล์' });

//     const filePath = result.recordset[0].FilePath;
//     if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'ไม่พบไฟล์ที่ server' });

//     const fileData = fs.readFileSync(filePath);
//     const base64Pdf = Buffer.from(fileData).toString('base64');
//     const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;

//     res.json({ fileName: path.basename(filePath), pdfData: pdfUrl });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
//   }
// };



// // upload.controller.js
// const fs = require('fs');
// const path = require('path');
// const sql = require("mssql");
// const { poolPromise } = require("../config/database");

// exports.loadPdfFromDbPath = async (req, res) => {
//   try {
//     const caseKey = req.body.caseKey; // ได้ caseKey จาก Angular

//     if (!caseKey) {
//       return res.status(400).json({ error: 'ต้องระบุ caseKey' });
//     }

//     const pool = await poolPromise;

//     // ดึง path ของไฟล์จาก database
//     const result = await pool.request()
//       .input('CASE', sql.NVarChar(50), caseKey)
//       .query(`
//         SELECT TOP 1 FilePath
//         FROM tb_IssueCuttingTool_Request_Document
//         WHERE [CASE] = @CASE AND FilePath IS NOT NULL
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ error: 'ไม่พบ path ของไฟล์' });
//     }

//     const filePath = result.recordset[0].FilePath;

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ error: 'ไม่พบไฟล์ที่ server' });
//     }

//     // อ่านไฟล์เป็น base64
//     const fileData = fs.readFileSync(filePath);
//     const base64Pdf = Buffer.from(fileData).toString('base64');
//     const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;

//     res.json({ fileName: path.basename(filePath), pdfData: pdfUrl });

//   } catch (err) {
//     console.error('loadPdfFromDbPath error:', err);
//     res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
//   }
// };
