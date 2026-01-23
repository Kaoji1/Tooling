const express = require('express');
const router = express.Router();
const returnController = require('../controllers/Return.controller');

router.get('/return/divisions', returnController.getDivisions);
router.get('/return/facilities/:divisionId', returnController.getFacilities);
router.get('/return/processes/:divisionId', returnController.getProcesses);
router.get('/return/item/:itemNo', returnController.getItemDetails);

module.exports = router;
