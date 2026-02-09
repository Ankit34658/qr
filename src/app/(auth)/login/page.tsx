"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Invalid email or password");
            }

            // Store user session
            localStorage.setItem("user", JSON.stringify(result.user));

            // Redirect to dashboard
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
                    <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition">
                        <QrCode className="text-white w-8 h-8" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">SafeDrive QR</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Log in to manage your vehicle QR codes</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="admin@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <Link href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Forgot password?</Link>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg shadow-blue-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-600 text-sm">
                        Don't have an account? <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700">Register now</Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center mt-8 text-gray-400 text-sm">
                    Protected by industry standard encryption.
                </p>
            </div>
        </div>
    );
}

