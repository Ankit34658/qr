"use client";

import { useState, useEffect } from "react";
import {
    User as UserIcon,
    Bell,
    Shield,
    Mail,
    Save,
    Lock,
    Smartphone,
    ChevronRight,
    Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type TabType = "Profile" | "Notifications" | "Security" | "Email SMTP";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("Profile");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: ""
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        scanAlerts: true,
        emergencyAlerts: true,
    });

    const [securitySettings, setSecuritySettings] = useState({
        twoFactorAuth: false,
        loginAlerts: true,
    });

    const [smtpSettings, setSmtpSettings] = useState({
        host: "smtp.gmail.com",
        port: "587",
        user: "",
        password: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                mobile: user.mobile || ""
            });

            // Load settings from database
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('app_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                // Parse settings JSON
                const settings = data.settings as any;
                if (settings.notifications) {
                    setNotificationSettings(settings.notifications);
                }
                if (settings.security) {
                    setSecuritySettings(settings.security);
                }
                if (settings.smtp) {
                    setSmtpSettings(settings.smtp);
                }
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const saveSettings = async (type: 'notifications' | 'security' | 'smtp', settings: any) => {
        if (!user) return;

        try {
            // Get existing settings
            const { data: existing } = await supabase
                .from('app_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            const currentSettings = existing?.settings as any || {};
            const updatedSettings = {
                ...currentSettings,
                [type]: settings
            };

            if (existing) {
                // Update existing
                await supabase
                    .from('app_settings')
                    .update({ settings: updatedSettings })
                    .eq('user_id', user.id);
            } else {
                // Insert new
                await supabase
                    .from('app_settings')
                    .insert({
                        user_id: user.id,
                        settings: updatedSettings
                    });
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert('Error saving settings: ' + err.message);
        }
    };


    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        setSuccess(false);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    mobile: formData.mobile
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update localStorage
            const updatedUser = { ...user, name: formData.name, mobile: formData.mobile };
            localStorage.setItem('user', JSON.stringify(updatedUser));

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
        <div className="max-w-4xl space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
                <p className="text-gray-500 mt-1">Manage your profile, security, and notification preferences.</p>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                {/* Navigation Tabs */}
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    {[
                        { icon: <UserIcon size={18} />, label: "Profile" },
                        { icon: <Bell size={18} />, label: "Notifications" },
                        { icon: <Shield size={18} />, label: "Security" },
                        { icon: <Mail size={18} />, label: "Email SMTP" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveTab(item.label as TabType)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition whitespace-nowrap shrink-0 lg:w-full ${activeTab === item.label ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100 bg-white md:bg-transparent'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm">
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm text-green-600 font-medium">✓ Settings saved successfully!</p>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === "Profile" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed text-gray-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "Notifications" && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
                            {[
                                { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via email" },
                                { key: "smsNotifications", label: "SMS Notifications", desc: "Receive SMS alerts" },
                                { key: "scanAlerts", label: "Scan Alerts", desc: "Get notified when QR codes are scanned" },
                                { key: "emergencyAlerts", label: "Emergency Alerts", desc: "Immediate alerts for emergency scans" },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-gray-900">{item.label}</p>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === "Security" && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
                            {[
                                { key: "twoFactorAuth", label: "Two-Factor Authentication", desc: "Add an extra layer of security", icon: <Lock size={20} /> },
                                { key: "loginAlerts", label: "Login Alerts", desc: "Get notified of new logins", icon: <Smartphone size={20} /> },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{item.icon}</div>
                                        <div>
                                            <p className="font-bold text-gray-900">{item.label}</p>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings[item.key as keyof typeof securitySettings]}
                                            onChange={(e) => setSecuritySettings({ ...securitySettings, [item.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Email SMTP Tab */}
                    {activeTab === "Email SMTP" && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900">SMTP Configuration</h3>
                            <p className="text-sm text-gray-500">Configure your email server for sending notifications</p>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SMTP Host</label>
                                <input
                                    type="text"
                                    value={smtpSettings.host}
                                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SMTP Port</label>
                                <input
                                    type="text"
                                    value={smtpSettings.port}
                                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SMTP Username</label>
                                <input
                                    type="text"
                                    value={smtpSettings.user}
                                    onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SMTP Password</label>
                                <input
                                    type="password"
                                    value={smtpSettings.password}
                                    onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                />
                            </div>
                            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                                <Save size={20} />
                                Save SMTP Settings
                            </button>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="mt-10 pt-10 border-t border-gray-200">
                        <div className="bg-red-50 rounded-[32px] border border-red-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <div className="p-4 bg-white rounded-2xl text-red-600 shadow-sm shrink-0">
                                    <Shield size={28} />
                                </div>
                                <div>
                                    <h4 className="font-black text-red-900 text-lg uppercase tracking-tight">Danger Zone</h4>
                                    <p className="text-red-700/70 text-sm">Permanently delete your account and all data.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDeleteAccount}
                                className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-100 whitespace-nowrap"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
