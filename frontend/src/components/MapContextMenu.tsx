'use client';

import React from 'react';
import { LatLng } from 'leaflet';

interface ContextMenuData {
    x: number;
    y: number;
    latlng: LatLng;
}

interface MapContextMenuProps {
    contextMenu: ContextMenuData | null;
    onSetStart: (latlng: LatLng) => void;
    onSetEnd: (latlng: LatLng) => void;
    onAddStop: (latlng: LatLng) => void;
    onClearAll: () => void;
    onClose: () => void;
}

const MapContextMenu: React.FC<MapContextMenuProps> = ({
    contextMenu,
    onSetStart,
    onSetEnd,
    onAddStop,
    onClearAll,
    onClose
}) => {
    if (!contextMenu) return null;

    const handleSetStart = () => {
        onSetStart(contextMenu.latlng);
        onClose();
    };

    const handleSetEnd = () => {
        onSetEnd(contextMenu.latlng);
        onClose();
    };

    const handleAddStop = () => {
        onAddStop(contextMenu.latlng);
        onClose();
    };

    const handleClearAll = () => {
        onClearAll();
        onClose();
    };

    return (
        <div
            className="absolute bg-white border border-gray-300 rounded-md shadow-lg z-[1002] min-w-[120px]"
            style={{
                left: contextMenu.x,
                top: contextMenu.y,
            }}
        >
            <div className="py-1">
                <button
                    onClick={handleSetStart}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    From
                </button>
                <button
                    onClick={handleSetEnd}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    To
                </button>
                <button
                    onClick={handleAddStop}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                >
                    Add Stop
                </button>
                <hr className="my-1" />
                <button
                    onClick={handleClearAll}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default MapContextMenu;