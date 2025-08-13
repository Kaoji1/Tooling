const express = require('express');
const router = express.Router();
// นำเข้าคอนโทรเลอร์
const CartController = require('../controllers/Cart.controller');
// กำหนดเส้นทาง 
router.post('/AddCartItems', CartController.AddCartItems);
router.get('/get_cart', CartController.GetCartItems);
router.delete('/delete_cart_item/:id', CartController.DeleteItem);
router.delete('/clear_cart', CartController.ClearAllItems);
// router.put('/update_cart_item', CartController.UpdateCartItem);
router.delete('/delete_cart_items_by_case/:case_', CartController.DeleteCartItemsByCase);
router.post('/update_cart_items', CartController.UpdateMultipleCartItems);
// ส่งออก router สำหรับใช้งานในที่อื่น
module.exports = router;