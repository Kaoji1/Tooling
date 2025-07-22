// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller');
const testController = require('../controllers/test.controller') // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม
const test = require('node:test');

// กำหนดเส้นทาง request
router.get('/get_PartNo', ItemlistController.Get_PartNo);

router.get('/get_SPEC/:PartNo', ItemlistController.Get_SPEC);

router.post('/get_PROCESS', ItemlistController.Get_PROCESS);

router.post('/get_MC', ItemlistController.Get_MC);




// Test
// router.get('/get_PARTNO', testController.Get_PARTNO); // เส้นทางสำหรับดึงข้อมูล PartNo ทั้งหมด

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;