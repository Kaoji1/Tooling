const express = require('express');
const router = express.Router();
const { uploadHandler, uploadFile } = require('../controllers/upload.controller');

router.post('/upload', uploadHandler, uploadFile);

module.exports = router;