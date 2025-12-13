'use client';

import { login, signup } from './actions';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Shield } from 'lucide-react';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoginForm() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo/Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
                        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-xl">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Card */}
                <Card className="border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
                    <CardHeader className="space-y-1 text-center pb-6">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                            Self-Exclusion Management System
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200 shadow-sm">
                                <AlertDescription className="text-sm text-red-800">
                                    {decodeURIComponent(error)}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Form */}
                        <form className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label htmlFor="email-address" className="text-sm font-medium text-gray-700">
                                    Email
                                </Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <Input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="h-12 pl-10 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="h-12 pl-10 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3 pt-2">
                                <Button
                                    formAction={login}
                                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    formAction={signup}
                                    variant="outline"
                                    className="w-full h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold rounded-lg transition-all duration-200"
                                >
                                    Sign Up
                                </Button>
                            </div>
                        </form>

                        {/* Footer */}
                        <p className="text-xs text-center text-gray-500 pt-2">
                            🔒 Secure access to patron management
                        </p>
                    </CardContent>
                </Card>

                {/* Bottom text */}
                <p className="mt-6 text-center text-xs text-gray-500">
                    Protected by enterprise-grade security
                </p>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-indigo-600"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
