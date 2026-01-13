const express = require('express');
const router = express.Router();
const controller = require('../controllers/MasterPH.controller');

router.get('/master-ph', controller.getAllMasterPHValues);
router.post('/master-ph/import', controller.importMasterData);

module.exports = router;
