// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller'); // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม

// กำหนดเส้นทาง request
router.get('/get_PARTNO', ItemlistController.Get_PARTNO);
router.get('/get_SPEC', ItemlistController.Get_SPEC);
router.get('/get_PROCESS', ItemlistController.Get_PROCESS);
router.get('/get_MACHINETYPE', ItemlistController.Get_MACHINETYPE);


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;