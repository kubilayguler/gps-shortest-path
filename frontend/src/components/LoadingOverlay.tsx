'use client';

import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';

const LoadingOverlay: React.FC = () => {
    const { isLoading, loadingMessage } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm mx-4">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                        <div className="font-medium text-gray-900">Loading</div>
                        {loadingMessage && (
                            <div className="text-sm text-gray-600">{loadingMessage}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;