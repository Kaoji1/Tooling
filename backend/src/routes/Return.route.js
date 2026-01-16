const express = require('express');
const router = express.Router();
const returnController = require('../controllers/Return.controller');

router.get('/return/item/:itemNo', returnController.getItemDetails);

module.exports = router;
