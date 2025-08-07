// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const PurchaseHistory = require('../controllers/purchasehistory.controller');
const test = require('node:test');

// กำหนดเส้นทาง History
router.get('/Purchase_History', PurchaseHistory.Purchase_History);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;