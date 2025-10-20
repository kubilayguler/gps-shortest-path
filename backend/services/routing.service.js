const axios = require('axios');

class RoutingService {
  constructor() {
    this.baseURL = 'https://router.project-osrm.org/route/v1';
    this.lastRequestTime = 0;
    this.minRequestInterval = 1100; // OSRM requires 1 req/sec, we use 1.1 sec to be safe
  }

  // Wait to respect rate limit
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async calculateRoute(startLat, startLng, endLat, endLng, profile = 'driving') {
        try {
          await this.waitForRateLimit();
          
          const url = `${this.baseURL}/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&steps=true&geometries=geojson`;
          
          const response = await axios.get(url, {
            timeout: 30000,
            headers: {
              'User-Agent': 'GPS-Shortest-Path-App/1.0'
            }
          });
          
          if (response.data.code === 'Ok' && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            
            return {
              success: true,
              weight: route.weight,
              duration: route.duration, 
              distance: route.distance,
              path: route.geometry.coordinates,
              steps: route.legs && route.legs[0] ? route.legs[0].steps : []
            };
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            throw new Error('OSRM service is temporarily unavailable due to rate limiting. Please wait a few minutes and try again.');
          }
          
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new Error('Route calculation timed out. Please wait a few minutes and try again.');
          }
          
          if (error.code === 'ECONNRESET') {
            throw new Error('Connection to routing service was reset. Please wait a few minutes and try again.');
          }
          
          throw new Error(`Failed to calculate route: ${error.message}`);
        }
  }

}

module.exports = RoutingService;