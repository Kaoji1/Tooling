const express = require('express');
const router = express.Router();
const controller = require('../controllers/PCPlan.controller'); // เช็ค path ให้ตรง

// 1. Route สำหรับดึง Division
// URL: /api/pc-plan/divisions
router.get('/divisions', controller.getDivisions);

// 2. Route สำหรับดึง Master Data ทั้งหมดในครั้งเดียว
// URL: /api/pc-plan/master-data/:divCode
router.get('/master-data/:divCode', controller.getMasterDataByDivision);

// 3. Route สำหรับบันทึกข้อมูล (Insert)
// URL: /api/pc-plan/insert
router.post('/insert', controller.insertPCPlan);

// 4. Route สำหรับดึงรายการ (Get List)
// URL: /api/pc-plan/list
router.get('/list', controller.getPlanList);

// 5. Route สำหรับลบข้อมูล (Delete)
// URL: /api/pc-plan/delete/:id
router.delete('/delete/:id', controller.deletePCPlan);

// 6. Route สำหรับดึงประวัติ (History)
// URL: /api/pc-plan/history/:groupId
router.get('/history/:groupId', controller.getPlanHistory);

// 7. Route สำหรับอัปเดต Path (ไม่เปลี่ยน Rev)
// URL: /api/pc-plan/update-paths
router.post('/update-paths', controller.updatePaths);

module.exports = router;