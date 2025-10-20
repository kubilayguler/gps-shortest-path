const express = require('express');
const router = express.Router();
const OrderController = require('../controller/order.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// All authenticated users can view orders (filtered by role in controller)
router.get('/', OrderController.getOrders);

// Driver gets their orders grouped by delivery with pagination
router.get('/my-orders-grouped', requireRole([4]), OrderController.getMyOrdersGrouped);

// Manager and Employee can create orders
router.post('/', requireRole([1, 2, 3]), OrderController.createOrder);

// Manager and Employee can update orders
router.put('/:id', requireRole([1, 2, 3, 4]), OrderController.updateOrder);

// Manager and Employee can assign drivers
router.post('/:id/assign', requireRole([1, 2, 3]), OrderController.assignDriver);

// All can update status (Driver updates delivery status)
router.patch('/:id/status', OrderController.updateOrderStatus);

// Driver can start delivery for multiple orders
router.post('/start-delivery', requireRole([4]), OrderController.startDelivery);

// Only Manager and Admin can delete
router.delete('/:id', requireRole([1, 2]), OrderController.deleteOrder);

module.exports = router;
