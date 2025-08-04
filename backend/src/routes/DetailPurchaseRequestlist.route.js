// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const DetailPurchaseRequestlist = require('../controllers/DetailPurchaseRequestlist.controller');
const test = require('node:test');

// กำหนดเส้นทาง request
router.get('/Purchase_Request', PurchaseRequest.Purchase_Request);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;