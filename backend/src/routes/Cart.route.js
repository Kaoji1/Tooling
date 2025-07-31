const express = require('express');
const router = express.Router();
const CartController = require('../controllers/Cart.controller');

router.post('/AddCartItems', CartController.AddCartItems);
router.get('/get_cart', CartController.GetCartItems);
router.delete('/delete_cart_item/:id', CartController.DeleteItem);
router.delete('/clear_cart', CartController.ClearAllItems);
router.put('/update_cart_item', CartController.UpdateCartItem);
router.delete('/delete_cart_items_by_case/:case_', CartController.DeleteCartItemsByCase);
module.exports = router;