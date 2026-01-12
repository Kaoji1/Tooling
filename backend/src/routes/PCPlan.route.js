const express = require('express');
const router = express.Router();
const controller = require('../controllers/PCPlan.controller'); // เช็ค path ให้ตรง

// 1. Route สำหรับดึง Division
// URL: /api/pc-plan/divisions
router.get('/divisions', controller.getDivisions);

// 2. Route สำหรับดึง Master Data ทั้งหมดในครั้งเดียว
// URL: /api/pc-plan/master-data/:divCode
router.get('/master-data/:divCode', controller.getMasterDataByDivision);

module.exports = router;