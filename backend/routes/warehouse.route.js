const express = require('express');
const router = express.Router();
const WarehouseController = require('../controller/warehouse.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// 1: Admin, 2: Manager, 3: Employee, 4: Driver
// Manager and Admin can manage warehouses
router.get('/', requireRole([1, 2]), WarehouseController.getWarehouses);
router.post('/', requireRole([1, 2]), WarehouseController.createWarehouse);
router.put('/:id', requireRole([1, 2]), WarehouseController.updateWarehouse);
router.delete('/:id', requireRole([1, 2]), WarehouseController.deleteWarehouse);

module.exports = router;
