"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Trash2,
    Car,
    User,
    Phone,
    Mail,
    Shield,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode } from "@/types";

export default function EditQRCodePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrCode, setQrCode] = useState<QRCode | null>(null);
    const [formData, setFormData] = useState({
        vehicle_number: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_color: "",
        vehicle_type: "car",
        owner_name: "",
        owner_mobile: "",
        owner_email: "",
        emergency_contact_1: "",
        emergency_contact_1_name: "",
        emergency_contact_2: "",
        emergency_contact_2_name: "",
        call_enabled: true,
        whatsapp_enabled: true,
        emergency_enabled: true,
        show_owner_name: false,
        require_otp: true,
        status: "active"
    });

    useEffect(() => {
        const fetchQRCode = async () => {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('qr_unique_id', params.id)
                .single();

            if (data) {
                setQrCode(data as QRCode);
                setFormData({
                    vehicle_number: data.vehicle_number || "",
                    vehicle_make: data.vehicle_make || "",
                    vehicle_model: data.vehicle_model || "",
                    vehicle_color: data.vehicle_color || "",
                    vehicle_type: data.vehicle_type || "car",
                    owner_name: data.owner_name || "",
                    owner_mobile: data.owner_mobile || "",
                    owner_email: data.owner_email || "",
                    emergency_contact_1: data.emergency_contact_1 || "",
                    emergency_contact_1_name: data.emergency_contact_1_name || "",
                    emergency_contact_2: data.emergency_contact_2 || "",
                    emergency_contact_2_name: data.emergency_contact_2_name || "",
                    call_enabled: data.call_enabled ?? true,
                    whatsapp_enabled: data.whatsapp_enabled ?? true,
                    emergency_enabled: data.emergency_enabled ?? true,
                    show_owner_name: data.show_owner_name ?? false,
                    require_otp: data.require_otp ?? true,
                    status: data.status || "active"
                });
            }
            setLoading(false);
        };

        fetchQRCode();
    }, [params.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('qr_codes')
                .update(formData)
                .eq('qr_unique_id', params.id);

            if (error) throw error;

            alert("QR Code settings updated successfully!");
            router.push("/admin/qr-codes");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('qr_codes')
                .delete()
                .eq('qr_unique_id', params.id);

            if (error) throw error;

            router.push("/admin/qr-codes");
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!qrCode) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-xl font-bold text-gray-900 mb-4">QR Code not found</p>
                <Link href="/admin/qr-codes" className="text-blue-600 hover:underline">
                    Back to QR Codes
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/qr-codes" className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Edit QR Code</h1>
                        <p className="text-gray-500 mt-1">{formData.vehicle_number}</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition flex items-center gap-2"
                >
                    <Trash2 size={18} />
                    Delete
                </button>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-8">
                {/* Vehicle Information */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Car size={24} className="text-blue-600" />
                        Vehicle Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Number *</label>
                            <input
                                type="text"
                                value={formData.vehicle_number}
                                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Type</label>
                            <select
                                value={formData.vehicle_type}
                                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            >
                                <option value="car">Car</option>
                                <option value="bike">Bike</option>
                                <option value="truck">Truck</option>
                                <option value="bus">Bus</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Make</label>
                            <input
                                type="text"
                                value={formData.vehicle_make}
                                onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Model</label>
                            <input
                                type="text"
                                value={formData.vehicle_model}
                                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Color</label>
                            <input
                                type="text"
                                value={formData.vehicle_color}
                                onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            >
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Owner Information */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User size={24} className="text-blue-600" />
                        Owner Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Owner Name *</label>
                            <input
                                type="text"
                                value={formData.owner_name}
                                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number *</label>
                            <input
                                type="tel"
                                value={formData.owner_mobile}
                                onChange={(e) => setFormData({ ...formData, owner_mobile: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.owner_email}
                                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone size={24} className="text-blue-600" />
                        Emergency Contacts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact 1 Name</label>
                            <input
                                type="text"
                                value={formData.emergency_contact_1_name}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_1_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact 1 Number</label>
                            <input
                                type="tel"
                                value={formData.emergency_contact_1}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_1: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact 2 Name</label>
                            <input
                                type="text"
                                value={formData.emergency_contact_2_name}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_2_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact 2 Number</label>
                            <input
                                type="tel"
                                value={formData.emergency_contact_2}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_2: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy Settings */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={24} className="text-blue-600" />
                        Privacy & Security
                    </h2>
                    <div className="space-y-4">
                        {[
                            { key: "call_enabled", label: "Enable Call Option", desc: "Allow scanners to call you" },
                            { key: "whatsapp_enabled", label: "Enable WhatsApp", desc: "Allow WhatsApp contact" },
                            { key: "emergency_enabled", label: "Emergency Alerts", desc: "Enable emergency contact feature" },
                            { key: "show_owner_name", label: "Show Owner Name", desc: "Display owner name to scanners" },
                            { key: "require_otp", label: "Require OTP Verification", desc: "Scanner must verify email before contact" },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData[item.key as keyof typeof formData] as boolean}
                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>
                    <Link
                        href="/admin/qr-codes"
                        className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
