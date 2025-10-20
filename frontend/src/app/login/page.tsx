'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { isLoading: globalLoading } = useLoading();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-950">
            {/* Sign in panel */}
            <div className="w-full max-w-md flex items-center z-10">
                <div className="w-full h-full bg-gradient-to-tr from-cyan-900/30 via-blue-600/15 to-blue-900/60 backdrop-blur-sm shadow-2xl  p-8 md:p-10 border-r border-slate-700/30">
                    <div className="mb-10 mt-16">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-blue-800/80 rounded-lg flex items-center justify-center border border-slate-700/50">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-200">
                                GPS Routing System
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm">Welcome back! Please sign in to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 text-slate-200 px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition placeholder-slate-500"
                                placeholder="Enter your email.."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 text-slate-200 px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition placeholder-slate-500"
                                placeholder="Enter your password.."
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={globalLoading}
                            className="w-full bg-blue-700 hover:bg-blue-600 text-slate-100 font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {globalLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="hidden md:block flex-1 relative">
                <Image
                    src="/bg.png"
                    alt="Login Page Background Image"
                    width={1344}
                    height={768}
                    className="w-full h-full object-cover"
                    priority
                />
                {/* darker effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-blue-900/50"></div>
            </div>

        </div>
    );
}