'use client';

import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { LatLng } from 'leaflet';

interface MapMarkersProps {
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    path: LatLng[];
}

const MapMarkers: React.FC<MapMarkersProps> = ({ startPoint, endPoint, path }) => {
    return (
        <>
            {/* Start Point */}
            {startPoint && (
                <Marker position={[startPoint.lat, startPoint.lng]}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-green-600">Start Point</h3>
                            <p className="text-sm text-gray-600">
                                {startPoint.lat.toFixed(6)}, {startPoint.lng.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* End Point */}
            {endPoint && (
                <Marker position={[endPoint.lat, endPoint.lng]}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-red-600">End Point</h3>
                            <p className="text-sm text-gray-600">
                                {endPoint.lat.toFixed(6)}, {endPoint.lng.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Route Path */}
            {path.length > 1 && (
                <Polyline
                    positions={path.map(point => [point.lat, point.lng])}
                    color="#3B82F6"
                    weight={4}
                    opacity={0.8}
                />
            )}
        </>
    );
};

export default MapMarkers;