'use client';

import { useState } from 'react';
import Image from 'next/image';
import TBGLogo from '@/assets/TBG.webp';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await authApi.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            console.error('Forgot password request failed:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-100 p-4 sm:p-8 md:p-12 justify-center items-center">
            <div className="flex w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl h-[700px] max-h-screen m-auto">

                {/* Left Side: Logo & Branding */}
                <div className="hidden lg:flex lg:w-[45%] flex-col relative bg-white items-center justify-center p-12 lg:border-r border-gray-100">
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

                {/* Right Side: Forgot Password Form */}
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-12 bg-white relative">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-orange-500 hover:text-orange-600 mb-6 transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                            <h2 className="text-3xl font-bold text-[#2b2d42] mb-3">
                                Forgot Password?
                            </h2>
                            <p className="text-[#8d99ae] text-sm leading-relaxed">
                                Enter your email address below and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="flex justify-center mb-6">
                                    <div className="rounded-full bg-green-50 p-3">
                                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-[#2b2d42] mb-2">Check your email</h3>
                                <p className="text-[#8d99ae] text-sm mb-8">
                                    A link has been sent to your email. Please follow the instructions to reset your password.
                                </p>
                                <Link
                                    href="/login"
                                    className="block w-full text-center rounded-lg bg-orange-500 hover:bg-orange-600 py-3.5 px-4 text-base font-semibold text-white shadow-md transition-all active:scale-[0.98]"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        ) : (
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
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
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
                                            "Send Reset Link"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
