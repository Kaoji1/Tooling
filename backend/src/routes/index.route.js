// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller'); // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม

// กำหนดเส้นทาง request
router.get('/get_PARTNO', ItemlistController.Post_PARTNO);
router.get('/post_PROCESS', ItemlistController.Post_PROCESS); // POST request สำหรับส่งข้อมูล process
router.get('/get_list_table', ItemlistController.Get_list_table); 


router.post('/post__MACHINETYPE', ItemlistController.Post_MACHINETYPE); // POST request สำหรับส่งประเภทเครื่องจักร
router.post('/post_item_no', ItemlistController.Post_item_detail); // POST request สำหรับส่งรายละเอียดของ item
router.post('/post_request_to_cart', ItemlistController.Post_request_to_cart); // POST request สำหรับส่งคำขอไปยังตะกร้า
router.post('/get_master_MCNO', ItemlistController.Get_master_MCNO);


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;