'use client';

import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 bg-[#10536d50] flex items-center justify-center z-[1001]">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm mx-4">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                        <div className="font-medium text-gray-900">Loading</div>
                        {message && (
                            <div className="text-sm text-gray-600">{message}</div>
                        )}
                    </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                    Routing to location...
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;