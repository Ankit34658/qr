"use client";

import { useState, useEffect } from "react";
import {
    User as UserIcon,
    Save,
    Shield,
    Loader2,
    Check
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        mobile_primary: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                email: user.email || "",
                mobile_primary: user.mobile_primary || ""
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        setSuccess(false);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    mobile_primary: formData.mobile_primary
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update localStorage
            const updatedUser = { ...user, full_name: formData.full_name, mobile_primary: formData.mobile_primary };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage'));

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This will permanently delete all your data including QR codes, scan logs, and settings. This action cannot be undone.")) return;

        try {
            if (user) {
                // Delete all related data first
                await supabase.from('scan_logs').delete().eq('qr_code_id', user.id);
                await supabase.from('qr_codes').delete().eq('user_id', user.id);
                await supabase.from('app_settings').delete().eq('user_id', user.id);
                await supabase.from('users').delete().eq('id', user.id);

                // Clear session
                localStorage.removeItem('user');

                // Redirect to home
                window.location.href = '/';
            }
        } catch (err: any) {
            alert('Error deleting account: ' + err.message);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500 mt-1">Manage your administrative profile and account security.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm">
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Check size={18} className="text-emerald-600" />
                        </div>
                        <p className="text-sm text-emerald-600 font-semibold">Profile updated successfully!</p>
                    </div>
                )}

                {/* User Avatar Section */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <UserIcon size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{formData.full_name || 'Admin User'}</h3>
                        <p className="text-sm text-gray-500">{formData.email}</p>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition font-semibold"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed text-gray-500 font-semibold"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed for security reasons</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                        <input
                            type="tel"
                            value={formData.mobile_primary}
                            onChange={(e) => setFormData({ ...formData, mobile_primary: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition font-semibold"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-100"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="p-4 bg-white rounded-2xl text-red-600 shadow-sm">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-900 text-lg">Delete Account</h4>
                            <p className="text-red-700 text-sm">Permanently delete your account and all associated data.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-100"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}