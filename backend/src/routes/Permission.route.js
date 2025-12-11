// นำเข้าไลบรารี express
const express = require('express'); 
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const permission = require('../controllers/Permission.controller');

router.get('/get_Permission', permission.ShowPermission);
router.post('/AddUserPermission', permission.AddUserPermission)
router.delete('/DeleteEmployeePermission/:Employee_ID', permission.DeleteEmployeePermission);
router.post('/updateEmployeePermission/:id', permission.updateEmployeePermission);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;