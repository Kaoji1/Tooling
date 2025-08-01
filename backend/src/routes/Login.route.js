const express = require('express');
const LoginController = require('../controllers/Login.controller');
const router = express.Router();


router.post('/login', LoginController.Login);

module.exports = router;