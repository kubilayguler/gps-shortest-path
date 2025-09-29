'use client';

import { useState } from 'react';
import { LatLng } from 'leaflet';
import { getPath } from '../utils/getPath';

interface RouteInfo {
    distance: number;
    duration: number;
    weight: number;
}

interface UseRoutingReturn {
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    path: LatLng[];
    loading: boolean;
    loadingMessage: string;
    routeInfo: RouteInfo | null;
    setStartPoint: (point: LatLng) => void;
    setEndPoint: (point: LatLng) => Promise<void>;
    clearAll: () => void;
}

export const useRouting = (): UseRoutingReturn => {
    const [startPoint, setStartPointState] = useState<LatLng | null>(null);
    const [endPoint, setEndPointState] = useState<LatLng | null>(null);
    const [path, setPath] = useState<LatLng[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    const setStartPoint = async (point: LatLng) => {


        setStartPointState(point);
        if (endPoint && point) {
            setLoading(true);
            setPath([]);
            setRouteInfo(null);
            await fetchRoute(endPoint, point);
        }
        return;


    };

    const setEndPoint = async (point: LatLng) => {

        setEndPointState(point);
        if (startPoint && point) {
            setLoading(true);
            setPath([]);
            setRouteInfo(null);
            await fetchRoute(startPoint, point);
        }
        return;
    };

    const fetchRoute = async (start: LatLng, end: LatLng) => {
        try {
            const result = await getPath(start, end, (message: string) => {
                setLoadingMessage(message);
            });

            if (result.success && result.path && Array.isArray(result.path) && result.path.length > 1) {
                const latLngPath = result.path.map(([lng, lat]: [number, number]) =>
                    new (window as any).L.LatLng(lat, lng)
                );
                setPath(latLngPath);
                setRouteInfo({
                    distance: result.distance,
                    duration: result.duration,
                    weight: result.weight
                });
            } else {
                alert('Error: Route not found');
                setPath([]);
                setRouteInfo(null);
            }
        } catch (error: any) {
            alert(error.message);
            setPath([]);
            setRouteInfo(null);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const clearAll = () => {
        setStartPointState(null);
        setEndPointState(null);
        setPath([]);
        setLoading(false);
        setLoadingMessage('');
        setRouteInfo(null);
        return;
    };

    return {
        startPoint,
        endPoint,
        path,
        loading,
        loadingMessage,
        routeInfo,
        setStartPoint,
        setEndPoint,
        clearAll
    };
};