'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useRouting } from '@/hooks/useRouting';
import { useAuth } from '@/contexts/AuthContext';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">Loading map...</p>
        </div>
    )
});

export default function RoutingPage() {
    const { createRouteFromStops } = useRouting();
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // if user is a driver (role 4)
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 4) {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <LoadingOverlay />;
    }

    if (!user || user.role !== 4) {
        return null;
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">

            <div className="flex-1 min-h-0 relative">
                <LeafletMap />
                <LoadingOverlay />
            </div>
        </div>
    );
}
