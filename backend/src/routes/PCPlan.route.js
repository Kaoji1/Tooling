const express = require('express');
const router = express.Router();
const controller = require('../controllers/PCPlan.controller'); // *แก้ path ให้ตรง

// Route สำหรับดึง Division
// URL: /api/pc-plan/divisions
router.get('/divisions', controller.getDivisions);

// Route สำหรับดึง Master Data อื่นๆ (ต้องส่ง ?div=xxx มาด้วย)
// URL: /api/pc-plan/machines?div=7122
router.get('/machines', controller.getMachinesByDivision);

// URL: /api/pc-plan/facilities?div=7122
router.get('/facilities', controller.getFacilitiesByDivision);

// URL: /api/pc-plan/processes?div=7122
router.get('/processes', controller.getProcessesByDivision);

// URL: /api/pc-plan/part-nos?div=7122
router.get('/part-nos', controller.getPartNosByDivision);

module.exports = router;