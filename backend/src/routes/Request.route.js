// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller');
const test = require('node:test');
console.log("✅ Request.route.js loaded");
// กำหนดเส้นทาง request
router.get('/get_Division', ItemlistController.Get_Division);

router.post('/get_Facility', ItemlistController.get_Facility);

router.post('/get_PartNo', ItemlistController.get_PartNo);

router.post('/get_Process', ItemlistController.Get_Process);

router.post('/get_MC', ItemlistController.Get_MC);

router.post('/post_ItemNo', ItemlistController.post_ItemNo);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;
