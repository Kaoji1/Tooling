// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const DetailPurchaseRequestlist = require('../controllers/DetailPurchaseRequestlist.controller');
const test = require('node:test');

// กำหนดเส้นทาง request
router.get('/Detail_Purchase', DetailPurchaseRequestlist.Detail_Purchase);
router.post('/Update_Status_Purchase', DetailPurchaseRequestlist.Update_Status_Purchase);


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;