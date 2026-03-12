// นำเข้าไลบรารี express
const express = require('express');
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const SendRequest = require('../controllers/SendRequest.controller')


// กำหนดเส้นทาง request
router.post('/Send_Request', SendRequest.Send_Request);
router.post('/GenerateNewDocNo', SendRequest.GenerateNewDocNo);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;