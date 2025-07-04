onst express = require('express');
const { mockItems } = require('../config/mockData');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = express.Router();

// Get all items
router.get('/', authenticateToken, (req, res) => {
  res.json(mockItems);
});

// Get items by category
router.get('/category/:category', authenticateToken, (req, res) => {
  const { category } = req.params;
});