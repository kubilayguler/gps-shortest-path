import { LatLng } from "leaflet";
import { apiGet } from './api';

export async function getPath(
    startPoint: LatLng, endPoint: LatLng, p0: (message: string) => void,
): Promise<any> {

    try {
        const data = await apiGet(
            `/routing?start=${startPoint.lat.toFixed(6)},${startPoint.lng.toFixed(6)}&end=${endPoint.lat.toFixed(6)},${endPoint.lng.toFixed(6)}`
        );
        return data;

    } catch (error: any) {
        throw error;
    }
}

