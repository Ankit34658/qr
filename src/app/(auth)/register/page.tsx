"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, Mail, Lock, User, Phone, Loader2, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            mobile: formData.get("mobile") as string,
        };

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Registration failed");
            }

            // Store user session
            localStorage.setItem("user", JSON.stringify(result.user));

            // Redirect to dashboard
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                        <p className="text-gray-500">Secure your vehicle with smart QR technology</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="John Doe"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm"
                                    />
                                    <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile No.</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="mobile"
                                        required
                                        placeholder="9876543210"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm"
                                    />
                                    <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="john@example.com"
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
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 items-start border border-blue-100">
                            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                By creating an account, you agree to our Terms of Service and Privacy Policy regarding vehicle data encryption.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg shadow-blue-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-600 text-sm">
                        Already have an account? <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
