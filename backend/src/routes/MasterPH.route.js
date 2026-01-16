const express = require('express');
const router = express.Router();
const controller = require('../controllers/MasterPH.controller');
// Routes
// Routes
router.get('/master-ph', controller.getAllMasterPHValues);
router.post('/master-ph/import', controller.importMasterData);
router.post('/master-ph/import-ireport', controller.importIReport); // New Route

module.exports = router;
