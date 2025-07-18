// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller'); // คอนโทรลเลอร์สำหรับจัดการรายการไอเท็ม

// กำหนดเส้นทาง request
router.get('/get_part_no', ItemlistController.Post_OPIST_PartNo);
router.post('/post_process', ItemlistController.Post_OPIST_Process); // POST request สำหรับส่งข้อมูล process
router.post('/post_machine_type', ItemlistController.OPIST_MC); // POST request สำหรับส่งประเภทเครื่องจักร
router.post('/post_item_no', ItemlistController.Post_item_detail); // POST request สำหรับส่งรายละเอียดของ item
router.post('/post_request_to_cart', ItemlistController.Post_request_to_cart); // POST request สำหรับส่งคำขอไปยังตะกร้า
router.get('/get_list_table', ItemlistController.Get_list_table); 
// Get_master_MCNO
router.post('/get_master_MCNO', ItemlistController.Get_master_MCNO);


// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;