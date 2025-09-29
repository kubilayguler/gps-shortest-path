const express = require('express');
const router = express.Router();
const RoutingController = require('../controller/routing.controller');

// GET /api/routing?start=lat,lng&end=lat,lng&profile=driving
router.get('/routing', (req, res) => RoutingController.getRoute(req, res));

module.exports = router;