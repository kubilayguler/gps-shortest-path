import { LatLng } from "leaflet";

const BASE_URL = 'http://localhost:5000/api/routing';

export async function getPath(
    startPoint: LatLng, endPoint: LatLng, p0: (message: string) => void,
): Promise<any> {

    try {
        const response = await fetch(
            `${BASE_URL}?start=${startPoint.lat.toFixed(6)},${startPoint.lng.toFixed(6)}&end=${endPoint.lat.toFixed(6)},${endPoint.lng.toFixed(6)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Error: Route not found');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;

    } catch (error: any) {
        throw error;
    }
}

