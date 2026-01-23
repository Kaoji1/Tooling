const express = require('express');
const router = express.Router();
const controller = require('../controllers/MasterPH.controller');
// Routes
// Routes
router.get('/master-ph', controller.getAllMasterPHValues);
router.post('/master-ph/import', controller.importMasterData);
router.post('/master-ph/import-type-tooling', controller.importTypeTooling);
router.post('/master-ph/import-master-all-pmc', controller.importMasterAllPMC);
router.post('/master-ph/import-master-tooling-pmc', controller.importMasterToolingPMC);
router.post('/master-ph/import-master-tooling-gm', controller.importMasterToolingGM);

module.exports = router;
