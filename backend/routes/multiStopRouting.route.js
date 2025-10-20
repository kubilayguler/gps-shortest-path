const express = require('express');
const router = express.Router();
const { MultiStopRoutingController } = require('../controller/multiStopRouting.controller');

/**
 * POST /api/multi-stop-routing
 */
router.post('/', (req, res) => MultiStopRoutingController.handleMultiStopRouting(req, res));


module.exports = router;