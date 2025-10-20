const RoutingService = require('../services/routing.service.js');

class RoutingController {
  static async getRoute(req, res) {
    try {
      const { start, end, profile = 'driving' } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'start and end coordinates are required'
        });
      }

      const [startLat, startLng] = start.split(',').map(Number);
      const [endLat, endLng] = end.split(',').map(Number);

      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'Coordinates must be valid numbers'
        });
      }

      const routingService = new RoutingService();
      const result = await routingService.calculateRoute(startLat, startLng, endLat, endLng, profile);
      res.json(result);

    } catch (error) {
      console.error('Routing Controller Error:', error.message);
      res.status(500).json({
        error: 'Route calculation failed',
        message: error.message,
      });
    }
  }
}

module.exports = RoutingController;
