const express = require('express');
const router = express.Router();
const returnController = require('../controllers/Return.controller');

router.get('/return/divisions', returnController.getDivisions);
router.get('/return/facilities/:divisionId', returnController.getFacilities);
router.get('/return/processes/:divisionId', returnController.getProcesses);
router.get('/return/item/:itemNo', returnController.getItemDetails);
router.get('/return/partno/:partNo', returnController.getPartNo); // New Route for PartNo
router.post('/return/save', returnController.saveReturnRequest); // Main Save Route
router.get('/return/list', returnController.getReturnList); // New History Route
router.get('/return/next-doc-no', returnController.getNextDocNo); // New Route for DocNo Sequence

module.exports = router;
