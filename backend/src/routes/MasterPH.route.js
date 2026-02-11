const express = require('express');
const router = express.Router();
const controller = require('../controllers/MasterPH.controller');
// Routes
// Routes
const upload = require('../config/multer.config');

router.get('/master-ph', controller.getAllMasterPHValues);
router.post('/master-ph/import', upload.single('file'), controller.importMasterData);
router.post('/master-ph/import-type-tooling', upload.single('file'), controller.importTypeTooling);
router.post('/master-ph/import-master-all-pmc', upload.single('file'), controller.importMasterAllPMC);
router.post('/master-ph/import-master-tooling-pmc', controller.importMasterToolingPMC);
// router.post('/master-ph/import-master-tooling-gm', upload.single('file'), controller.importMasterToolingGM); // Disabled per user request
router.post('/master-ph/import-ireport', upload.single('file'), controller.importIReport);

module.exports = router;
