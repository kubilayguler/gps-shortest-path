'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import RouteInfoPanel from './RouteInfoPanel';
import MapMarkers from './MapMarkers';

import { useRouting } from '../hooks/useRouting';
import { useLoading } from '../contexts/LoadingContext';

import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapControllerProps {
    center: [number, number];
    zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, zoom, {
                animate: true,
                duration: 1
            });
        }
    }, [center, zoom, map]);

    return null;
};

interface LeafletMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
    center = [37.8557, 32.5085], // if there is no center provided, fallback to Konya/Turkiye
    zoom = 12,
    className = ''
}) => {
    const router = useRouter();
    const { setLoading, setLoadingMessage } = useLoading();
    const {
        startPoint,
        endPoint,
        path,
        stops,
        routeInfo,
        currentSegmentIndex,
        removeStop,
        clearAll,
        createRouteFromStops,
        restoreRouteFromCache,
        completeCurrentStop,
        undoStopCompletion
    } = useRouting();

    useEffect(() => {
        const checkCompletion = () => {
            const completedFlag = sessionStorage.getItem('allDeliveriesCompleted');
            if (completedFlag === 'true') {
                console.log('All deliveries completed! Redirecting to My Orders...');

                sessionStorage.removeItem('allDeliveriesCompleted');
                sessionStorage.removeItem('deliveryWaypoints');
                sessionStorage.removeItem('calculatedRoute');

                router.push('/dashboard/my-orders');
            }
        };

        checkCompletion();
        const interval = setInterval(checkCompletion, 1000);

        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        const checkAndLoadRoute = () => {
            const savedRoute = sessionStorage.getItem('calculatedRoute');

            if (savedRoute) {
                try {
                    const routeData = JSON.parse(savedRoute);

                    if (routeData.stops && Array.isArray(routeData.stops) && routeData.stops.length >= 2) {
                        const stopsLatLng = routeData.stops.map((stop: any) =>
                            new L.LatLng(Number(stop.lat), Number(stop.lng))
                        );

                        restoreRouteFromCache(stopsLatLng);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to parse saved route:', error);
                    sessionStorage.removeItem('calculatedRoute');
                }
            }

            const deliveryWaypoints = sessionStorage.getItem('deliveryWaypoints');

            if (deliveryWaypoints) {
                try {
                    const stopsData = JSON.parse(deliveryWaypoints);

                    if (!Array.isArray(stopsData) || stopsData.length === 0) {
                        return;
                    }

                    const hasValidData = stopsData.every(stop =>
                        stop &&
                        typeof stop.lat === 'number' &&
                        typeof stop.lng === 'number' &&
                        !isNaN(stop.lat) &&
                        !isNaN(stop.lng)
                    );

                    if (!hasValidData) {
                        return;
                    }

                    const deliveryPoints = stopsData.map((stop: any) =>
                        new L.LatLng(Number(stop.lat), Number(stop.lng))
                    );


                    createRouteFromStops(deliveryPoints);

                } catch (error) {
                    console.error('Failed to parse route stops:', error);
                }
            }
        };


        checkAndLoadRoute();

    }, []);

    // calculate map center based on current segment
    // if currentSegmentIndex exists, use the start point of current segment (stops[currentSegmentIndex])
    // otherwise, use stops[0] (first stop) if available, or fallback to default center
    const mapCenter: [number, number] = (() => {
        if (stops && stops.length > 0) {
            const centerIndex = typeof currentSegmentIndex === 'number' && currentSegmentIndex >= 0
                ? currentSegmentIndex
                : 0;

            if (stops[centerIndex]) {
                return [stops[centerIndex].lat, stops[centerIndex].lng];
            }
        }
        return center;
    })();

    return (
        <div className="relative w-full h-full">
            {/* Route Info Panel */}
            {routeInfo && (
                <RouteInfoPanel
                    routeInfo={routeInfo}
                    stops={stops}
                    currentSegmentIndex={currentSegmentIndex}
                    onCompleteStop={completeCurrentStop}
                />
            )}

            {/* Map Container */}
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Dynamic map center controller */}
                <MapController center={mapCenter} zoom={zoom} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Markers and Path */}
                <MapMarkers
                    startPoint={startPoint}
                    endPoint={endPoint}
                    path={path}
                    stops={stops}
                    segments={routeInfo?.segments}
                    currentSegmentIndex={currentSegmentIndex}
                />
            </MapContainer>
        </div>
    );
};
export default LeafletMap;