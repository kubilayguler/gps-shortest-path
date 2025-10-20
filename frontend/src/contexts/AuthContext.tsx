'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLoading } from './LoadingContext';
import { apiGet, apiPost } from '@/utils/api';

interface User {
    id: number;
    email: string;
    name: string;
    role: number;
    company_id?: string;
    warehouse_id?: string;
    warehouse?: {
        id: string;
        name: string;
        address: string;
    };
}

interface MenuItem {
    id: string;
    name: string;
    path: string;
    icon: string;
}

interface AuthContextType {
    user: User | null;
    menu: MenuItem[];
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setLoading, setLoadingMessage } = useLoading();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const [userData, menuData] = await Promise.all([
                apiGet('/auth/me'),
                apiGet('/auth/menu')
            ]);

            if (userData?.success && userData?.data && menuData?.success && menuData?.data) {
                setUser(userData.data);
                setMenu(menuData.data.menu);
            } else {
                try {
                    sessionStorage.removeItem('deliveryWaypoints');
                    sessionStorage.removeItem('calculatedRoute');
                } catch (e) {
                    // silent fail because user is not logged in and doesn't have to see this errors
                }
                setUser(null);
                setMenu([]);
            }
        } catch (error: any) {
            if (error?.status !== 401) {
                console.error('Auth check error:', error);
            }
            try {
                sessionStorage.removeItem('deliveryWaypoints');
                sessionStorage.removeItem('calculatedRoute');
            } catch (e) {
                // silent fail because user is not logged in and doesn't have to see this errors
            }
            setUser(null);
            setMenu([]);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        setLoadingMessage('Signing in...');

        try {
            const data = await apiPost('/auth/login', { email, password });

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            const { user: userData } = data.data;
            setUser(userData);

            await fetchUserData();
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            throw new Error(error.message || 'Login failed');
        }
    };

    const logout = async () => {
        setLoading(true);
        setLoadingMessage('Logging out...');

        try {
            await apiPost('/auth/logout', {});
        } catch (error) {
            console.warn('Logout endpoint failed:', error);
        }

        try {
            sessionStorage.removeItem('deliveryWaypoints');
            sessionStorage.removeItem('calculatedRoute');
        } catch (e) {
            console.warn('Failed to clear sessionStorage:', e);
        }

        setUser(null);
        setMenu([]);
        setLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                menu,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
