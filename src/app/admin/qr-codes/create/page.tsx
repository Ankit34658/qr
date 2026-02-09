"use client";

import { useState } from "react";
import {
    Car,
    User,
    Settings as SettingsIcon,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    ChevronRight,
    Plus,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function CreateQRPage() {
    const { user, loading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        vehicle_number: "",
        vehicle_type: "Car",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_color: "",
        owner_name: "",
        owner_mobile: "",
        emergency_contact_1: "",
        emergency_contact_1_name: "",
        call_enabled: true,
        whatsapp_enabled: true,
        emergency_enabled: true,
        require_otp: true,
        show_owner_name: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleToggle = (name: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: !(prev as any)[name]
        }));
    };

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleGenerate = async () => {
        if (!user) {
            setError("You must be logged in to generate a QR code.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    user_id: user.id
                })
            });
            const data = await response.json();
            if (data.success) {
                router.push("/admin/qr-codes");
            } else {
                throw new Error(data.error || "Failed to generate QR code");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Create New QR</h1>
                    <p className="text-gray-500 mt-1">Follow the steps to generate a secure vehicle tag.</p>
                </div>
                <Link href="/admin/qr-codes" className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2">
                    <ArrowLeft size={18} /> Cancel
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Progress Bars */}
            <div className="flex items-center gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-grow flex flex-col gap-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${step >= (i + 1) ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step >= (i + 1) ? 'text-blue-600' : 'text-gray-400'}`}>
                            Step {i + 1}
                        </span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-[40px] shadow-xl shadow-blue-100/50 border border-gray-100 overflow-hidden">
                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Car className="text-blue-600" /> Vehicle Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Vehicle Number</label>
                                    <input
                                        name="vehicle_number"
                                        value={formData.vehicle_number}
                                        onChange={handleChange}
                                        type="text" placeholder="e.g. MH 12 AB 1234"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Vehicle Type</label>
                                    <select
                                        name="vehicle_type"
                                        value={formData.vehicle_type}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold appearance-none"
                                    >
                                        <option>Car</option>
                                        <option>Bike</option>
                                        <option>Truck</option>
                                        <option>Bus</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Vehicle Make</label>
                                    <input
                                        name="vehicle_make"
                                        value={formData.vehicle_make}
                                        onChange={handleChange}
                                        type="text" placeholder="e.g. Honda"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Vehicle Model</label>
                                    <input
                                        name="vehicle_model"
                                        value={formData.vehicle_model}
                                        onChange={handleChange}
                                        type="text" placeholder="e.g. City"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <User className="text-blue-600" /> Owner Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Owner Name</label>
                                    <input
                                        name="owner_name"
                                        value={formData.owner_name}
                                        onChange={handleChange}
                                        type="text" placeholder="Full legal name"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Primary Mobile</label>
                                    <input
                                        name="owner_mobile"
                                        value={formData.owner_mobile}
                                        onChange={handleChange}
                                        type="tel" placeholder="9876543210"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Emergency Contact 1</label>
                                    <input
                                        name="emergency_contact_1"
                                        value={formData.emergency_contact_1}
                                        onChange={handleChange}
                                        type="tel" placeholder="Mobile number"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Contact 1 Name</label>
                                    <input
                                        name="emergency_contact_1_name"
                                        value={formData.emergency_contact_1_name}
                                        onChange={handleChange}
                                        type="text" placeholder="Name or Relationship"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 outline-none transition font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <SettingsIcon className="text-blue-600" /> Privacy Settings
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { label: "Phone Calls Enabled", name: "call_enabled", desc: "Allow scanners to initiate a masked call" },
                                    { label: "WhatsApp Messaging", name: "whatsapp_enabled", desc: "Enable WhatsApp contact option" },
                                    { label: "Emergency Alerts", name: "emergency_enabled", desc: "Fast-track access for critical situations" },
                                    { label: "Show Owner Name", name: "show_owner_name", desc: "Display your name on the scan page" },
                                    { label: "Require OTP Verification", name: "require_otp", desc: "Ask scanners to verify email for general issues" },
                                ].map((pref, i) => (
                                    <div key={i} onClick={() => handleToggle(pref.name)} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-white transition cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl border-2 ${(formData as any)[pref.name] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                                <Plus size={16} className={(formData as any)[pref.name] ? '' : 'opacity-0'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{pref.label}</h4>
                                                <p className="text-sm text-gray-500">{pref.desc}</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${(formData as any)[pref.name] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(formData as any)[pref.name] ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-fadeIn text-center">
                            <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={64} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Review & Generate</h2>
                            <div className="bg-gray-50 rounded-[32px] p-8 text-left grid md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Vehicle Summary</p>
                                    <p className="font-bold text-lg">{formData.vehicle_number || "No Plate"}</p>
                                    <p className="text-gray-600">{formData.vehicle_make} {formData.vehicle_model}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Owner Summary</p>
                                    <p className="font-bold text-lg">{formData.owner_name || "No Name"}</p>
                                    <p className="text-gray-600">{formData.owner_mobile}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-6 border-t flex justify-between">
                    {step > 1 ? (
                        <button onClick={handleBack} className="px-8 py-3 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition flex items-center gap-2">
                            <ArrowLeft size={18} /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 4 ? (
                        <button onClick={handleNext} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
                            Continue <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Generating..." : "Generate QR Code"}
                            {!loading && <Plus size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
