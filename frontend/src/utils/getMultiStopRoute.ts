import { LatLng } from 'leaflet';
import { apiPost } from './api';

export const getMultiStopRoute = async (
    stops: LatLng[]
): Promise<{ lat: number; lng: number }[]> => {
    try {
        const stopsData = stops.map(stop => ({
            lat: stop.lat,
            lng: stop.lng
        }));

        const result = await apiPost('/multi-stop-routing', {
            stops: stopsData
        });

        if (result.success && result.data && result.data.route) {
            return result.data.route;
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.error('Multi-stop route error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to calculate multi-stop route: ${errorMessage}`);
    }
};