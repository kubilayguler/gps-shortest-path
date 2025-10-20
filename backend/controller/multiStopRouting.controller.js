const { MultiStopRoutingService } = require('../services/multiStopRouting.service');

class MultiStopRoutingController {
    static async handleMultiStopRouting(req, res) {
        try {
            const { stops } = req.body;

            const routingService = new MultiStopRoutingService();
            const result = await routingService.createRouteFromStops(stops);
            
            res.status(200).json({
                success: true,
                message: 'Multi-stop routing processed',
                data: result
            });
        } catch (error) {
            console.error('Multi-stop routing controller error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = {
    MultiStopRoutingController
};

module.exports = {
    MultiStopRoutingController
};