'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TBGLogo from '@/assets/TBG.webp';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.login(formData.email, formData.password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login failed:', err);
            if (err.response?.status === 404) {
                setError('Login endpoint not found (404). Please verify API URL.');
            } else {
                setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 p-4 sm:p-8 md:p-12 lg:p-24 justify-center items-center">
            <div className="flex w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl h-[800px] max-h-screen">

                {/* Left Side: Logo & Branding */}
                <div className="hidden lg:flex lg:w-[45%] flex-col relative bg-white items-center justify-center p-12 lg:border-r border-gray-100">

                    <div className="absolute top-12 left-12 flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                            A
                        </div>
                        <span className="text-2xl font-bold text-[#343a40]">Akademi</span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm">
                        <Image
                            src={TBGLogo}
                            alt="TBG Logo"
                            width={280}
                            height={120}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-12 bg-white relative">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-[#2b2d42] mb-3">
                                Sign in your account
                            </h2>
                            <p className="text-[#8d99ae] text-sm leading-relaxed">
                                Welcome back! Login with your data that you<br className="hidden lg:block" /> entered during registration
                            </p>
                        </div>



                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-[#8d99ae]">
                                    Email<span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-lg border border-gray-200 py-3 px-4 text-[#2b2d42] placeholder-[#adb5bd] focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] outline-none transition-all shadow-sm"
                                    placeholder="demo@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-semibold text-[#8d99ae]">
                                        Password<span className="text-red-500">*</span>
                                    </label>
                                    <Link href="#" className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full rounded-lg border border-gray-200 py-3 px-4 text-[#2b2d42] placeholder-[#adb5bd] focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] outline-none transition-all shadow-sm"
                                    placeholder="••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-[#4f46e5] focus:ring-[#4f46e5] outline-none cursor-pointer"
                                    checked={formData.remember}
                                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm font-medium text-[#8d99ae] cursor-pointer">
                                    Remember my preference
                                </label>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                    <p className="text-sm font-medium text-red-600">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "w-full flex justify-center items-center rounded-lg bg-orange-500 hover:bg-orange-600 py-3.5 px-4 text-base font-semibold text-white shadow-md transition-all active:scale-[0.98]",
                                        loading && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Sign Me In"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
