'use client';

import React from 'react';

interface RouteInfo {
    distance: number;
    duration: number;
    weight: number;
}

interface RouteInfoPanelProps {
    routeInfo: RouteInfo;
    onClear: () => void;
}

const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({ routeInfo, onClear }) => {
    const formatDistance = (distance: number) => {
        return distance >= 1000
            ? `${(distance / 1000).toFixed(1)} km`
            : `${Math.round(distance)} m`;
    };

    const formatDuration = (duration: number) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.round(duration % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    return (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-[150px]">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                Info
                <button
                    onClick={onClear}
                    className="ml-auto text-red-500 hover:text-red-700 text-sm transition-colors cursor-pointer"
                    title="Clear"
                >
                    Clear
                </button>
            </h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{formatDistance(routeInfo.distance)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(routeInfo.duration)}</span>
                </div>

            </div>
        </div>
    );
};

export default RouteInfoPanel;