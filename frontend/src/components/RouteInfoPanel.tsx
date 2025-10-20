'use client';

import React, { useState } from 'react';
import { LatLng } from 'leaflet';
import { RouteSegment } from '@/hooks/useRouting';

interface RouteInfo {
    distance: number;
    duration: number;
    weight: number;
    segments?: RouteSegment[];
    currentSegmentIndex?: number;
}

interface RouteInfoPanelProps {
    routeInfo: RouteInfo;
    stops: LatLng[]; // first stop is warehouse, rest are delivery locations
    currentSegmentIndex: number;
    onCompleteStop: () => Promise<void>;
}

const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
    routeInfo,
    stops,
    currentSegmentIndex,
    onCompleteStop
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    const formatDistance = (distance: number) => {
        return distance >= 1000
            ? `${(distance / 1000).toFixed(1)} km`
            : `${Math.round(distance)} m`;
    };

    const formatDuration = (duration: number) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);

        if (hours > 0) {
            return `${hours} hr ${minutes} min`;
        } else if (minutes > 0) {
            return `${minutes} min`;
        } else {
            return '< 1 min';
        }
    };

    // SVG Icons for maneuvers
    const getManeuverSVG = (type: string, modifier?: string) => {
        const key = modifier ? `${type}-${modifier}` : type;

        const svgIcons: { [key: string]: React.ReactNode } = {
            'turn-right': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 6l6 6-6 6v-5H6V9h8V4z" />
                </svg>
            ),
            'turn-left': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6L4 12l6 6v-5h8v-4h-8V4z" />
                </svg>
            ),
            'turn-slight-right': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4l5 5-5 5v-3H9v8H6v-9a2 2 0 012-2h8V4z" />
                </svg>
            ),
            'turn-slight-left': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 4L3 9l5 5V11h7v8h3v-9a2 2 0 00-2-2H8V4z" />
                </svg>
            ),
            'turn-sharp-right': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2l4 4-4 4V7h-6a4 4 0 00-4 4v9H5v-9a7 7 0 017-7h6V2z" />
                </svg>
            ),
            'turn-sharp-left': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2L2 6l4 4V7h6a4 4 0 014 4v9h3v-9a7 7 0 00-7-7H6V2z" />
                </svg>
            ),
            'depart': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l9 9-9 9V4z" />
                </svg>
            ),
            'arrive': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
            ),
            'continue': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2v20M8 6l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            ),
            'merge': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 2v7.5L12 14v8h3v-8.5L10 9V2H7z" />
                </svg>
            ),
            'roundabout': (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 4l4 4-4 4V4z" />
                </svg>
            )
        };

        return svgIcons[key] || (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l9 9-9 9V4z" />
            </svg>
        );
    };

    const currentSegment = routeInfo.segments?.[currentSegmentIndex];
    const isLastSegment = currentSegmentIndex >= (routeInfo.segments?.length || 0) - 1;
    const isFirstSegment = currentSegmentIndex === 0;
    const allDeliveriesCompleted = currentSegmentIndex >= (routeInfo.segments?.length || 0);

    const deliveryStops = stops.slice(1);

    const handleCompleteDelivery = async () => {
        setIsUpdating(true);
        try {
            await onCompleteStop();
        } catch (error) {
            console.error('Error in handleCompleteDelivery:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-1/2 -translate-y-1/2 z-[1001] bg-blue-600 rounded-l-lg shadow-xl px-1.5 py-4 transition-all duration-300 hover:bg-blue-700 ${isOpen ? 'right-[380px]' : 'right-0'
                    }`}
                title={isOpen ? 'Close' : 'Open'}
            >
                <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    )}
                </svg>
            </button>

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[1000] transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ width: '380px' }}
            >
                {/* Header - Distance and Time */}
                <div className="bg-white border-b ">
                    <div className="flex px-4 pt-2 items-center justify-between mb-1">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {formatDuration(routeInfo.duration)}
                        </h3>
                        <span className="text-sm text-gray-500">
                            ({currentSegmentIndex + 1}/{deliveryStops.length})
                        </span>
                    </div>
                    <p className=" text-sm px-4 text-gray-600">
                        {formatDistance(routeInfo.distance)} · Fastest route
                    </p>
                    {currentSegment && (
                        <div className="bg-orange-50 p-4 mt-3 pt-3 border-t ">
                            <p className="text-xs text-gray-500 mb-1">Next cargo destination:</p>
                            <p className="font-semibold text-gray-900">
                                Cargo {currentSegmentIndex + 1}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {formatDistance(currentSegment.distance)} · {formatDuration(currentSegment.duration)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Steps List */}
                {currentSegment && (
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="p-2">
                            {currentSegment.steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 mb-2 ${index % 2 === 0 ? 'bg-neutral-100' : 'bg-neutral-50'} rounded-lg transition-`}
                                >
                                    {/* Icon */}
                                    <div className="mt-0.5 text-gray-700">
                                        {getManeuverSVG(step.maneuver.type, step.maneuver.modifier)}
                                    </div>

                                    {/* Instruction */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {step.instruction}
                                        </p>
                                        {step.name && step.name !== 'Unnamed road' && (
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {step.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Distance */}
                                    <div className="text-xs text-gray-500 whitespace-nowrap mt-0.5">
                                        {formatDistance(step.distance)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cargo List */}
                <div className="border-t bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        All Cargo Destinations ({deliveryStops.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {deliveryStops.map((stop, index) => {
                            const isCompleted = index < currentSegmentIndex;
                            const isCurrent = index === currentSegmentIndex;

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${isCompleted
                                        ? 'bg-green-50 text-green-800'
                                        : isCurrent
                                            ? 'bg-blue-50 text-blue-900 font-semibold border-2 border-blue-300'
                                            : 'bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span>
                                        {isCompleted && '✓ '}
                                        {isCurrent && '→ '}
                                        Cargo {index + 1}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">
                                            Active
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t p-4 bg-white">
                    <button
                        onClick={handleCompleteDelivery}
                        disabled={allDeliveriesCompleted || isUpdating}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${allDeliveriesCompleted || isUpdating
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isUpdating ? 'Updating...' : allDeliveriesCompleted ? 'All Completed ✓' : 'Complete Delivery'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default RouteInfoPanel;
