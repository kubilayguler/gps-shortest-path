'use client';

import { useState } from 'react';
import { LatLng } from 'leaflet';
import { getPath } from '../utils/getPath';
import { getMultiStopRoute } from '../utils/getMultiStopRoute';
import { apiPatch } from '../utils/api';
import { useLoading } from '../contexts/LoadingContext';

export interface RouteStep {
    distance: number;
    duration: number;
    name: string;
    instruction: string;
    maneuver: {
        type: string;
        modifier?: string;
        bearing_after: number;
        location: [number, number];
    };
}

export interface RouteSegment {
    startStopIndex: number;
    endStopIndex: number;
    distance: number;
    duration: number;
    steps: RouteStep[];
    path: LatLng[];
}

interface RouteInfo {
    distance: number;
    duration: number;
    weight: number;
    segments?: RouteSegment[];
    currentSegmentIndex?: number;
}

interface UseRoutingReturn {
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    path: LatLng[];
    stops: LatLng[];
    routeInfo: RouteInfo | null;
    currentSegmentIndex: number;
    setStartPoint: (point: LatLng) => void;
    setEndPoint: (point: LatLng) => Promise<void>;
    addStop: (point: LatLng) => void;
    removeStop: (index: number) => void;
    clearStops: () => void;
    createRouteFromStops: (stops: LatLng[]) => Promise<void>;
    restoreRouteFromCache: (stops: LatLng[]) => Promise<void>;
    clearAll: () => void;
    completeCurrentStop: () => Promise<void>;
    undoStopCompletion: () => Promise<void>;
}

export const useRouting = (): UseRoutingReturn => {
    const [startPoint, setStartPointState] = useState<LatLng | null>(null);
    const [endPoint, setEndPointState] = useState<LatLng | null>(null);
    const [path, setPath] = useState<LatLng[]>([]);
    const [stops, setStops] = useState<LatLng[]>([]);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);

    const { setLoading, setLoadingMessage } = useLoading();



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
        clearStops();

        try {
            sessionStorage.removeItem('deliveryWaypoints');
            sessionStorage.removeItem('calculatedRoute');
        } catch (e) {
            console.warn('Failed to clear sessionStorage:', e);
        }
    };

    const addStop = (point: LatLng) => {
        setStops(prev => [...prev, point]);
    };

    const removeStop = (index: number) => {
        setStops(prev => prev.filter((_, i) => i !== index));
    };

    const clearStops = () => {
        setStops([]);
    };

    const createRouteFromStops = async (stops: LatLng[]) => {
        if (!stops || stops.length < 2) {
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage('Optimizing route order...');

            const optimizedRoute = await getMultiStopRoute(stops);

            const optimizedStops = optimizedRoute.map(stop =>
                new (window as any).L.LatLng(stop.lat, stop.lng)
            );

            setStops(optimizedStops);

            await createStopRoutes(optimizedStops);

            try {
                const routeData = {
                    stops: optimizedRoute,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('calculatedRoute', JSON.stringify(routeData));
            } catch (e) {
                console.warn('Failed to save calculated route:', e);
            }

        } catch (error: any) {
            console.error('Route calculation failed:', error);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const restoreRouteFromCache = async (stops: LatLng[]) => {
        if (!stops || stops.length < 2) {
            return;
        }

        try {
            setStops(stops);

            const calculatedRoute = sessionStorage.getItem('calculatedRoute');
            if (calculatedRoute) {
                try {
                    const routeData = JSON.parse(calculatedRoute);
                    if (typeof routeData.currentSegmentIndex === 'number') {
                        setCurrentSegmentIndex(routeData.currentSegmentIndex);
                    }
                } catch (e) {
                    console.warn('Failed to restore currentSegmentIndex:', e);
                }
            }

            await createStopRoutes(stops);
        } catch (error: any) {
            console.error('Failed to restore route:', error);
        }
    };

    const createStopRoutes = async (optimizedStops: LatLng[]) => {
        if (optimizedStops.length < 2) {
            alert('At least 2 stops are required to create a route.');
            return;
        }
        try {
            setLoading(true);
            setLoadingMessage('Calculating multi-stop route...');
            setPath([]);

            let combinedPath: LatLng[] = [];
            let totalDistance = 0;
            let totalDuration = 0;
            let totalWeight = 0;
            const segments: RouteSegment[] = [];

            for (let i = 0; i < optimizedStops.length - 1; i++) {
                if (optimizedStops[i] && optimizedStops[i + 1]) {
                    const result = await getPath(optimizedStops[i], optimizedStops[i + 1], (message: string) => {
                        setLoadingMessage(`${message} (${i + 1}/${optimizedStops.length - 1})`);
                    });

                    if (result.success && result.path && Array.isArray(result.path) && result.path.length > 1) {
                        const latLngPath = result.path.map(([lng, lat]: [number, number]) =>
                            new (window as any).L.LatLng(lat, lng)
                        );


                        const steps: RouteStep[] = result.steps?.map((step: any) => ({
                            distance: step.distance,
                            duration: step.duration,
                            name: step.name || 'Unnamed road',
                            instruction: step.maneuver?.instruction || getManeuverInstruction(step.maneuver),
                            maneuver: {
                                type: step.maneuver?.type || 'turn',
                                modifier: step.maneuver?.modifier,
                                bearing_after: step.maneuver?.bearing_after || 0,
                                location: step.maneuver?.location || [0, 0]
                            }
                        })) || [];


                        segments.push({
                            startStopIndex: i,
                            endStopIndex: i + 1,
                            distance: result.distance,
                            duration: result.duration,
                            steps,
                            path: latLngPath
                        });


                        if (combinedPath.length > 0) {
                            combinedPath.push(...latLngPath.slice(1));
                        } else {
                            combinedPath.push(...latLngPath);
                        }

                        totalDistance += result.distance;
                        totalDuration += result.duration;
                        totalWeight += result.weight;
                    }
                }
            }

            setPath(combinedPath);

            let restoredSegmentIndex = 0;
            const calculatedRoute = sessionStorage.getItem('calculatedRoute');
            if (calculatedRoute) {
                try {
                    const routeData = JSON.parse(calculatedRoute);
                    if (typeof routeData.currentSegmentIndex === 'number') {
                        restoredSegmentIndex = routeData.currentSegmentIndex;
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }

            setRouteInfo({
                distance: totalDistance,
                duration: totalDuration,
                weight: totalWeight,
                segments,
                currentSegmentIndex: restoredSegmentIndex
            });


            if (restoredSegmentIndex === 0) {
                setCurrentSegmentIndex(0);
            }

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const getManeuverInstruction = (maneuver: any): string => {
        if (!maneuver) return 'Continue';

        const type = maneuver.type || '';
        const modifier = maneuver.modifier || '';

        const instructions: { [key: string]: string } = {
            'turn-slight-right': 'Turn slightly right',
            'turn-right': 'Turn right',
            'turn-sharp-right': 'Turn sharp right',
            'turn-slight-left': 'Turn slightly left',
            'turn-left': 'Turn left',
            'turn-sharp-left': 'Turn sharp left',
            'depart': 'Depart',
            'arrive': 'Arrive',
            'merge': 'Merge',
            'roundabout': 'Enter roundabout',
            'continue': 'Continue straight'
        };

        const key = modifier ? `${type}-${modifier}` : type;
        return instructions[key] || 'Continue';
    };

    const completeCurrentStop = async () => {
        if (routeInfo && routeInfo.segments && currentSegmentIndex <= routeInfo.segments.length - 1) {
            setLoading(true);
            setLoadingMessage('Updating delivery status...');

            try {
                // get order IDs from session storage
                const deliveryWaypoints = sessionStorage.getItem('deliveryWaypoints');
                if (deliveryWaypoints) {
                    const waypointsData = JSON.parse(deliveryWaypoints);

                    // Simple approach: Just move to next segment
                    // currentSegmentIndex represents which segment is active
                    // Segment 0: warehouse → cargo1
                    // Segment 1: cargo1 → cargo2
                    // Segment 2: cargo2 → cargo3

                    // Get the delivery we're completing (end of current segment)
                    const deliveryIndex = currentSegmentIndex + 1;
                    const isLastDelivery = currentSegmentIndex === routeInfo.segments.length - 1;

                    if (waypointsData[deliveryIndex] && waypointsData[deliveryIndex].orderId) {
                        const orderId = waypointsData[deliveryIndex].orderId;

                        setLoadingMessage('Marking order as delivered...');

                        // update order status
                        const result = await apiPatch(`/orders/${orderId}/status`, {
                            status: 'delivered'
                        });

                        if (!result.success) {
                            throw new Error(result.message || 'Failed to update order status');
                        }

                        waypointsData[deliveryIndex].status = 'delivered';
                        sessionStorage.setItem('deliveryWaypoints', JSON.stringify(waypointsData));

                        if (isLastDelivery) {
                            setLoadingMessage('All deliveries completed! Redirecting...');

                            await new Promise(resolve => setTimeout(resolve, 1000));

                            // clear route from map
                            setPath([]);
                            setStops([]);
                            setRouteInfo(null);
                            setCurrentSegmentIndex(0);

                            sessionStorage.removeItem('deliveryWaypoints');
                            sessionStorage.removeItem('calculatedRoute');

                            sessionStorage.setItem('allDeliveriesCompleted', 'true');
                        } else {
                            setLoadingMessage('Moving to next segment...');

                            const newSegmentIndex = currentSegmentIndex + 1;
                            setCurrentSegmentIndex(newSegmentIndex);
                            setRouteInfo(prev => prev ? { ...prev, currentSegmentIndex: newSegmentIndex } : null);

                            const calculatedRoute = sessionStorage.getItem('calculatedRoute');
                            if (calculatedRoute) {
                                const routeData = JSON.parse(calculatedRoute);
                                routeData.currentSegmentIndex = newSegmentIndex;
                                sessionStorage.setItem('calculatedRoute', JSON.stringify(routeData));
                            }

                        }
                    } else {
                        console.error('No orderId found at delivery index:', deliveryIndex);
                    }
                }

                setLoadingMessage('');
            } catch (error) {
                console.error('Error completing stop:', error);
                alert('Failed to update delivery status. Please try again.');
            } finally {
                setLoading(false);
                setLoadingMessage('');
            }
        }
    };

    const undoStopCompletion = async () => {
        // Note: Undo is disabled because the route is recalculated after each delivery
        // and the completed waypoint is removed from the route
        alert('Undo feature is not available when route recalculation is enabled.');
        return;
    };

    return {
        startPoint,
        endPoint,
        path,
        stops,
        routeInfo,
        currentSegmentIndex,
        setStartPoint,
        setEndPoint,
        addStop,
        removeStop,
        clearStops,
        createRouteFromStops,
        restoreRouteFromCache,
        clearAll,
        completeCurrentStop,
        undoStopCompletion
    };
}