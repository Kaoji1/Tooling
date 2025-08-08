const express = require('express');
const router = express.Router();
// นำเข้าคอนโทรเลอร์
const EmployeeController = require('../controllers/Employee.controller');
// กำหนดเส้นทาง
router.get('/get_Employee', EmployeeController.ShowUser)
// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;