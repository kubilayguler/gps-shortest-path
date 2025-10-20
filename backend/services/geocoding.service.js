const axios = require('axios');

 // geocoding service using Nominatim API
 // converts address to latitude/longitude

class GeocodingService {
    constructor() {
        this.baseUrl = 'https://nominatim.openstreetmap.org';
        this.userAgent = 'GPS-Shortest-Path-App/1.0';
    }

    async addressToLatLng(address) {
        try {
            if (!address || typeof address !== 'string') {
                throw new Error('Valid address string is required');
            }

            console.log(`🌍 Geocoding address: ${address}`);

            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 5000
            });

            if (!response.data || response.data.length === 0) {
                throw new Error(`Address not found: ${address}`);
            }

            const result = response.data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            console.log(`✅ Geocoded: ${address} -> (${lat}, ${lng})`);

            return {
                lat,
                lng,
                displayName: result.display_name
            };

        } catch (error) {
            if (error.response) {
                console.error('Nominatim API error:', error.response.status, error.response.data);
                throw new Error(`Geocoding failed: ${error.response.statusText}`);
            } else if (error.request) {
                console.error('Nominatim API timeout or network error');
                throw new Error('Geocoding service unavailable');
            } else {
                console.error('Geocoding error:', error.message);
                throw error;
            }
        }
    }


    async batchGeocode(addresses) {
        const results = [];
        
        // Nominatim rate limit: max 1 request per second
        for (const address of addresses) {
            try {
                const coords = await this.addressToLatLng(address);
                results.push({ address, ...coords });
                
                // Wait 1 second between requests to respect rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to geocode: ${address}`, error.message);
                results.push({ address, error: error.message, lat: null, lng: null });
            }
        }

        return results;
    }


    async latLngToAddress(lat, lng) {
        try {
            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 5000
            });

            if (!response.data) {
                throw new Error('Reverse geocoding failed');
            }

            return response.data.display_name;

        } catch (error) {
            console.error('Reverse geocoding error:', error.message);
            throw error;
        }
    }
}

module.exports = new GeocodingService();
