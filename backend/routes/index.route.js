// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรลเลอร์ที่ใช้สำหรับจัดการคำขอ

const masterRequestsController = require('../controllers/masterRequestsController');
const authController = require('../controllers/auth.controller');
const CartController = require('../controllers/CartController');
const ListQuestController = require('../controllers/ListRequestController');
const DetailController = require('../controllers/DetailController');
const ReceiveController = require('../controllers/ReceiveController');
const HistoryController = require('../controllers/HistoryController');

// Grinding routes
const CartGrindingController = require('../controllers/CartGrindingController');
const ListGrindingController = require('../controllers/ListGrindingController');
const DetailGrindingController = require('../controllers/DetailGrindingController');
const ReceiveGrindingController = require('../controllers/ReceiveGrindingController');
const HistoryGrindingController = require('../controllers/HistoryGrindingController');
const Req_GrindingController = require('../controllers/Req_GrindingController');

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;

// กำหนดเส้นทาง request
router.get('/get_part_no', masterRequestsController.Post_OPIST_PartNo); // GET request สำหรับดึงหมายเลขพาร์ท
router.post('/post_process', masterRequestsController.Post_OPIST_Process); // POST request สำหรับส่งข้อมูล process
router.post('/post_machine_type', masterRequestsController.OPIST_MC); // POST request สำหรับส่งประเภทเครื่องจักร
router.post('/post_item_no', masterRequestsController.Post_item_detail); // POST request สำหรับส่งรายละเอียดของ item
router.post('/post_request_to_cart', masterRequestsController.Post_request_to_cart); // POST request สำหรับส่งคำขอไปยังตะกร้า
router.get('/get_list_table', masterRequestsController.Get_list_table); 


// กำหนดเส้นทาง login
router.post('/login', authController.login); // POST request สำหรับการเข้าสู่ระบบ
router.post('/register', authController.register); // POST request สำหรับการลงทะเบียน
// router.post('/logout', authController.logout); // ยังไม่ได้ทำ
// router.post('/settimeout', authController.settimeout); // ยังไม่ได้ทำ

// กำหนดเส้นทาง Cart
router.post('/post_request_for_merge_doc', CartController.Post_request_for_merge_doc); // POST request สำหรับส่งคำขอการรวมเอกสาร
router.post('/delete_item', CartController.Delete_item); // POST request สำหรับลบ item
router.post('/post_create_doc', CartController.Post_create_doc); // POST request สำหรับสร้างเอกสาร

// กำหนดเส้นทาง list request
router.post('/post_list_queue', ListQuestController.Post_list_queue); // POST request สำหรับส่งรายการคิว
router.post('/delete_doc_no', ListQuestController.Delete_doc_no); // POST request สำหรับลบหมายเลขเอกสาร
router.post('/change_to_in_progress', ListQuestController.Change_to_in_progress); // POST request สำหรับลบหมายเลขเอกสาร
// กำหนดเส้นทาง receive
router.post('/Get_receive_list', ReceiveController.Get_receive_list); // POST request สำหรับดึงรายการที่ได้รับ

// กำหนดเส้นทาง history
router.post('/Get_history_list', HistoryController.Get_history_list); // POST request สำหรับดึงประวัติการดำเนินการ

// กำหนดเส้นทาง detail
router.post('/post_table_detail', DetailController.Post_table_detail); // POST request สำหรับส่งรายละเอียดของตาราง
router.post('/post_set_by', DetailController.Post_set_by); // POST request สำหรับส่งข้อมูลที่ตั้งโดย
router.post('/post_receive', DetailController.Post_receive); // POST request สำหรับส่งข้อมูลการรับ
router.post('/post_dashboard_detail', DetailController.Post_dashboard_detail); // POST request ส่งหน้าdashboard
