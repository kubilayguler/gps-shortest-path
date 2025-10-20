'use client';

import React, { useMemo } from 'react';
import { Marker, Polyline, Tooltip } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { RouteSegment } from '@/hooks/useRouting';
import L from 'leaflet';

interface MapMarkersProps {
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    path: LatLng[];
    stops: LatLng[];
    segments?: RouteSegment[];
    currentSegmentIndex?: number;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
    startPoint,
    endPoint,
    path,
    stops,
    segments,
    currentSegmentIndex = 0
}) => {

    const greenIcon = useMemo(() => new L.Icon({
        iconUrl: '/marker-icon-green.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }), []);

    const greyIcon = useMemo(() => new L.Icon({
        iconUrl: '/marker-icon-grey.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }), []);

    const orangeIcon = useMemo(() => new L.Icon({
        iconUrl: '/marker-icon-orange.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }), []);

    const blueIcon = useMemo(() => new L.Icon({
        iconUrl: '/marker-icon-blue.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }), []);

    return (
        <>
            {/* Start Point */}
            {startPoint && (
                <Marker position={[startPoint.lat, startPoint.lng]}>
                    <Tooltip direction="top" offset={[0, -35]} opacity={0.95}>
                        <div className="font-semibold text-green-600">Start Point</div>
                    </Tooltip>
                </Marker>
            )}

            {/* End Point */}
            {endPoint && (
                <Marker position={[endPoint.lat, endPoint.lng]}>
                    <Tooltip direction="top" offset={[0, -35]} opacity={0.95}>
                        <div className="font-semibold text-red-600">End Point</div>
                    </Tooltip>
                </Marker>
            )}

            {/* Route Path with Segments - Simplified opacity */}
            {segments && segments.length > 0 ? (
                segments.map((segment, index) => {
                    const isCurrent = index === currentSegmentIndex;

                    return (
                        <Polyline
                            key={`segment-${index}-current-${currentSegmentIndex}`}
                            positions={segment.path.map(point => [point.lat, point.lng])}
                            color="#2563EB"
                            weight={7}
                            opacity={isCurrent ? 1.0 : 0.5}

                        />
                    );
                })
            ) : (
                /* Fallback for simple path rendering */
                path.length > 1 && (
                    <Polyline
                        positions={path.map(point => [point.lat, point.lng])}
                        color="#2563EB"
                        weight={6}
                        opacity={0.6}
                    />
                )
            )}

            {/* Stops with custom markers */}
            {stops && stops.length > 0 && (
                stops.map((stop, index) => {
                    const isPast = index < currentSegmentIndex + 1;
                    const isCurrent = index === currentSegmentIndex + 1;
                    const isWarehouse = index === 0;
                    const isLast = index === stops.length - 1;

                    let customIcon;
                    let markerColor;

                    if (isWarehouse) {
                        customIcon = greenIcon;
                        markerColor = '#22c55e'; // green
                    } else if (isCurrent) {
                        customIcon = orangeIcon;
                        markerColor = '#f97316'; // orange
                    } else if (isPast) {
                        customIcon = blueIcon;
                        markerColor = '#2563EB'; // blue
                    } else {
                        customIcon = greyIcon;
                        markerColor = '#9ca3af'; // gray
                    }

                    let label = '';
                    if (isWarehouse) {
                        label = 'Warehouse';
                    } else if (isLast) {
                        label = `Cargo ${index}`;
                    } else {
                        label = `Cargo ${index}`;
                    }

                    return (
                        <Marker
                            key={`marker-${index}-current-${currentSegmentIndex}`}
                            position={[stop.lat, stop.lng]}
                            icon={customIcon}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -35]}
                                opacity={0.95}
                                permanent={isCurrent}
                                className="custom-tooltip"
                            >
                                <div className="font-semibold text-sm" style={{ color: markerColor }}>
                                    {isPast && !isWarehouse && '✓ '}
                                    {isCurrent && '➤ '}
                                    {label}
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })
            )}
        </>
    );
};

export default MapMarkers;