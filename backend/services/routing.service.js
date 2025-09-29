const axios = require('axios');
const dijkstra = require('../utils/dijkstra');
const { calculateDistance } = require('../utils/haversine');

class RoutingService {
  constructor() {
    this.baseURL = 'https://router.project-osrm.org/route/v1';
  }

  async calculateRoute(startLat, startLng, endLat, endLng, profile = 'driving') {
        try {
          const url = `${this.baseURL}/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&steps=true&geometries=geojson`;
          const response = await axios.get(url);
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
          console.error('OSRM API error:', error.message);
        }
  }

}

module.exports = RoutingService;