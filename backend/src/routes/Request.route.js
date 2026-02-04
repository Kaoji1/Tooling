// นำเข้าไลบรารี express
const express = require('express');
const router = express.Router(); // สร้าง instance ของ Router

// นำเข้าคอนโทรเลอร์
const ItemlistController = require('../controllers/Itemlist.controller');
const test = require('node:test');
console.log("✅ Request.route.js loaded");
// กำหนดเส้นทาง request
router.get('/get_Division', ItemlistController.Get_Division);

router.post('/get_Facility', ItemlistController.get_Facility);

router.post('/get_PartNo', ItemlistController.get_PartNo);

router.post('/get_Process', ItemlistController.Get_Process);

router.post('/get_MC', ItemlistController.Get_MC);

router.post('/post_ItemNo', ItemlistController.post_ItemNo);

// Setup Tool Routes
router.get('/get_Setup_Division', ItemlistController.get_Setup_Division);
router.post('/get_Setup_Facility', ItemlistController.get_Setup_Facility);
router.post('/get_Setup_PartNo', ItemlistController.get_Setup_PartNo);
router.post('/get_Setup_Process', ItemlistController.get_Setup_Process);
router.post('/get_Setup_MC', ItemlistController.get_Setup_MC);
router.post('/get_Setup_Items', ItemlistController.get_Setup_Items_Result);

// Case SET Routes (CuttingTool + SetupTool)
router.post('/get_CaseSET_CuttingTool', ItemlistController.get_CaseSET_CuttingTool);
router.post('/get_CaseSET_SetupTool', ItemlistController.get_CaseSET_SetupTool);
router.post('/get_CaseSET_CuttingTool_Detail', ItemlistController.get_CaseSET_CuttingTool_Detail);

// Case SET Dropdown Routes
router.post('/get_CaseSET_Dropdown_PartNo', ItemlistController.get_CaseSET_Dropdown_PartNo);
router.post('/get_CaseSET_Dropdown_Process', ItemlistController.get_CaseSET_Dropdown_Process);
router.post('/get_CaseSET_Dropdown_MC', ItemlistController.get_CaseSET_Dropdown_MC);

// MC by Division (แสดงเฉยๆ ไม่ใช้กรอง)
router.post('/get_MC_ByDivision', ItemlistController.get_MC_ByDivision);

// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;
