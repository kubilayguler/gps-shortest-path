'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import RouteInfoPanel from './RouteInfoPanel';
import LoadingOverlay from './LoadingOverlay';
import MapContextMenu from './MapContextMenu';
import MapMarkers from './MapMarkers';

import { useRouting } from '../hooks/useRouting';

// Leaflet icon fix for Next.js
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ContextMenu {
    x: number;
    y: number;
    latlng: LatLng;
}

interface LeafletMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
    center = [37.997780, 32.512784],
    zoom = 15,
    className = ''
}) => {
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

    const {
        startPoint,
        endPoint,
        path,
        loading,
        loadingMessage,
        routeInfo,
        setStartPoint,
        setEndPoint,
        clearAll
    } = useRouting();

    const MapEventHandler = () => {
        useMapEvents({
            contextmenu: (e) => {
                if (loading) return;
                e.originalEvent.preventDefault();
                setContextMenu({
                    x: e.containerPoint.x,
                    y: e.containerPoint.y,
                    latlng: e.latlng
                });
            },
            click: () => {
                setContextMenu(null);
            }
        });
        return null;
    };

    const handleSetStart = async (latlng: LatLng) => {
        setContextMenu(null);
        await setStartPoint(latlng);
    };

    const handleSetEnd = async (latlng: LatLng) => {
        setContextMenu(null);
        await setEndPoint(latlng);
    };

    const handleClearAll = () => {
        setContextMenu(null);
        clearAll();
    };

    return (
        <div className={`relative ${className}`}>
            {/* Route Info Panel */}
            {routeInfo && (
                <RouteInfoPanel
                    routeInfo={routeInfo}
                    onClear={handleClearAll}
                />
            )}

            {/* Map Container */}
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Markers and Path */}
                <MapMarkers
                    startPoint={startPoint}
                    endPoint={endPoint}
                    path={path}
                />

                <MapEventHandler />
            </MapContainer>

            {/* Loading Overlay */}
            <LoadingOverlay
                isVisible={loading}
                message={loadingMessage}
            />

            {/* Context Menu */}
            {contextMenu && !loading && (
                <MapContextMenu
                    contextMenu={contextMenu}
                    onSetStart={handleSetStart}
                    onSetEnd={handleSetEnd}
                    onClearAll={handleClearAll}
                />
            )}
        </div>
    );
};

export default LeafletMap;