// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller'); // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม

// กำหนดเส้นทาง request
router.get('/get_PARTNO', ItemlistController.Get_PARTNO);

router.get('/get_SPEC', ItemlistController.Post_SPEC);

router.post("/process", ItemlistController.Post_PROCESS);





// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;