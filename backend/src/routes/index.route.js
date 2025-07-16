// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router


// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller'); // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม


// กำหนดเส้นทาง request
router.get('/PartName', ItemlistController.PartName); // POST request สำหรับดึงหมายเลขพาร์ท


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;