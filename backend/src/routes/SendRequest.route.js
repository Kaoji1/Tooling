// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const SendRequest = require('../controllers/SendRequest.controller')
const test = require('node:test');

// กำหนดเส้นทาง request
router.post('/Send_Request', SendRequest.Send_Request);


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;