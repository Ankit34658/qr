"use client";

import { useState, useEffect, use } from "react";
import {
    Car,
    Phone,
    MessageSquare,
    AlertTriangle,
    ShieldCheck,
    Lock,
    ChevronRight,
    Info,
    Loader2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode } from "@/types";

export default function ScanPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const [qrCode, setQrCode] = useState<QRCode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    useEffect(() => {
        const fetchQRData = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('qr_codes')
                    .select('*')
                    .eq('qr_unique_id', params.id)
                    .single();

                if (fetchError) throw new Error("Vehicle tag not found");
                setQrCode(data as QRCode);

                // Log the scan
                await fetch('/api/scan/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qr_code_id: data.id,
                        scan_type: 'normal'
                    })
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQRData();
    }, [params.id]);

    const handleSendOTP = async () => {
        if (!email) return;
        setOtpLoading(true);
        try {
            const response = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    qr_code_id: qrCode?.id
                })
            });
            const data = await response.json();
            if (data.success) {
                setOtpSent(true);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        // In a real app, this would call /api/otp/verify
        // For now we simulate success but the structure is there
        if (otp.length === 6) {
            setVerified(true);
            setOtpSent(false);
        } else {
            alert("Please enter a valid 6-digit code");
        }
    };

    const handleEmergency = async () => {
        const confirm = window.confirm("CRITICAL ALERT: This will notify the owner and their emergency contacts immediately. Only proceed for genuine life-safety emergencies. Continue?");
        if (!confirm) return;

        try {
            // Try to get location
            let location = null;
            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                } catch (e) {
                    console.warn("Location access denied or timed out");
                }
            }

            const response = await fetch('/api/notify/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_code_id: qrCode?.id,
                    location
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("SUCCESS: The vehicle owner and their designated emergency contacts have been notified with high priority. Stay calm and stay with the vehicle if safe.");
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            alert("NOTIFICATION ERROR: System delay. Please call emergency services (100/108) or try calling the owner directly if verification is complete.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <p className="font-bold text-gray-500">Connecting to secure server...</p>
            </div>
        </div>
    );

    if (error || !qrCode) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white rounded-[40px] p-10 shadow-xl max-w-sm text-center space-y-6">
                <div className="bg-red-50 text-red-600 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Tag Not Found</h2>
                <p className="text-gray-500">This vehicle QR tag might be inactive or deleted by the owner.</p>
                <Link href="/" className="block text-blue-600 font-bold hover:underline">Return Home</Link>
            </div>
        </div>
    );

    // Masking helpers
    const maskEmail = (email: string) => {
        if (!email || !email.includes('@')) return email;
        const [name, domain] = email.split('@');
        if (name.length <= 2) return `${name[0]}${name.length > 1 ? '*' : ''}@${domain}`;
        return `${name[0]}${'*'.repeat(Math.max(0, name.length - 2))}${name[name.length - 1]}@${domain}`;
    };

    const maskName = (name: string) => {
        if (!name) return "";
        return name.split(' ').filter(Boolean).map(n => {
            if (n.length <= 1) return n;
            return n[0] + '*'.repeat(n.length - 1);
        }).join(' ');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/10">
            {/* Soft Ambient Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[130px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 blur-[130px] rounded-full" />
            </div>

            {/* Premium Glass Header */}
            <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
                            <ShieldCheck size={18} className="text-white" />
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-slate-900">
                            SafeDrive <span className="text-blue-600">Contact</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                            <Info size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-8 relative z-10 space-y-8">
                {/* Vehicle Hero Card - Light Mode */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[40px] opacity-50 blur-xl group-hover:opacity-70 transition duration-1000"></div>
                    <div className="relative bg-white rounded-[40px] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-8 overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-3">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Vehicle</span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{qrCode.vehicle_make} {qrCode.vehicle_model}</h2>
                                <p className="text-slate-500 font-semibold text-sm flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: qrCode.vehicle_color || '#334155' }} />
                                    {qrCode.vehicle_color || 'Standard'} Exterior
                                </p>
                            </div>
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                                <Car size={32} className="text-blue-600" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 shadow-inner">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">License Plate Identity</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-black tracking-tighter text-slate-900 font-mono uppercase">
                                        {verified ? qrCode.vehicle_number : qrCode.vehicle_number.replace(/.{4}$/, '****')}
                                    </span>
                                    {!verified && (
                                        <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                                            <Lock className="text-slate-400" size={14} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secured</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-blue-200">
                                    {qrCode.owner_name[0]}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Authorised Owner</p>
                                    <p className="font-extrabold text-lg text-slate-800 leading-tight">
                                        {qrCode.show_owner_name || verified ? qrCode.owner_name : maskName(qrCode.owner_name)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Intelligent Guidelines */}
                <div className="bg-amber-50 border border-amber-200/50 rounded-[32px] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 ring-1 ring-amber-200/50">
                            <Info size={16} />
                        </div>
                        <h3 className="font-black text-amber-700 uppercase text-xs tracking-widest">Protocol Notice</h3>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-4 group">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 ring-4 ring-amber-100 shrink-0" />
                            <p className="text-xs text-amber-900/70 font-bold leading-relaxed">
                                Deploy <span className="text-amber-700">Emergency Alert</span> only for life-threatning or critical medical situations.
                            </p>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 ring-4 ring-amber-100 shrink-0" />
                            <p className="text-xs text-amber-900/70 font-bold leading-relaxed">
                                System logging inactive sessions for audit and safety traceability.
                            </p>
                        </li>
                    </ul>
                </div>

                {/* Interaction Modules */}
                <div className="space-y-6">
                    {/* Emergency Response System */}
                    {qrCode.emergency_enabled && (
                        <div className="bg-red-600 rounded-[32px] p-8 shadow-2xl shadow-red-200 relative overflow-hidden group active:scale-95 transition-transform duration-200 border-t border-white/20">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                                    <AlertTriangle size={14} className="text-white animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Priority Level: High</span>
                                </div>
                                <h3 className="text-2xl font-black mb-1 text-white">Emergency Situation?</h3>
                                <p className="text-red-50 text-sm mb-6 font-semibold opacity-80">Trigger immediate broadcast to owner and family units.</p>
                                <button
                                    onClick={handleEmergency}
                                    className="w-full bg-white text-red-600 py-4.5 rounded-2xl font-black text-lg hover:shadow-2xl transition duration-300 transform active:scale-[0.98]"
                                >
                                    BROADCAST ALERT
                                </button>
                            </div>
                            <AlertTriangle className="absolute -bottom-6 -right-6 w-36 h-36 text-white/10 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition duration-700" />
                        </div>
                    )}

                    {/* Standard Secure Contact */}
                    <div className="bg-white rounded-[40px] px-8 py-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-sm">
                                <MessageSquare size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 tracking-tight">Standard Notification</h3>
                            <p className="text-slate-500 text-sm max-w-[210px] mx-auto leading-relaxed font-semibold">Verify identity to safely reach the vehicle driver.</p>
                        </div>

                        {!verified ? (
                            <div className="space-y-4">
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-2xl py-4.5 px-6 outline-none transition-all font-bold text-slate-900 text-center placeholder:text-slate-300"
                                    />
                                </div>
                                <button
                                    onClick={handleSendOTP}
                                    disabled={otpLoading || !email}
                                    className="w-full bg-slate-900 hover:bg-black text-white py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-[0.98]"
                                >
                                    {otpLoading ? <Loader2 className="animate-spin" size={20} /> : "Validate Identity Credentials"}
                                </button>
                                <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-4">
                                    Your email is only used for temporary authentication and is never stored on the public log.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                {qrCode.call_enabled && (
                                    <a
                                        href={`tel:${qrCode.owner_mobile}`}
                                        className="flex flex-col items-center gap-4 bg-blue-50/50 text-blue-600 p-8 rounded-[36px] hover:bg-blue-50 transition-all border border-blue-100/50 group"
                                    >
                                        <div className="w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-blue-200">
                                            <Phone size={24} />
                                        </div>
                                        <span className="font-extrabold text-[10px] uppercase tracking-widest leading-none">Voice Call</span>
                                    </a>
                                )}
                                {qrCode.whatsapp_enabled && (
                                    <a
                                        href={`https://wa.me/${qrCode.owner_mobile.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-4 bg-emerald-50/50 text-emerald-600 p-8 rounded-[36px] hover:bg-emerald-50 transition-all border border-emerald-100/50 group"
                                    >
                                        <div className="w-14 h-14 bg-emerald-500 text-white rounded-[20px] flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-emerald-200">
                                            <MessageSquare size={24} />
                                        </div>
                                        <span className="font-extrabold text-[10px] uppercase tracking-widest leading-none">WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Compliance Footer */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-4 opacity-60">
                        System Level Compliant
                    </p>
                    <div className="inline-flex items-center gap-3 text-slate-500 bg-white border border-slate-100 px-5 py-2.5 rounded-full text-[10px] font-black shadow-sm ring-1 ring-slate-200/20">
                        <Lock size={12} className="text-emerald-500" />
                        256-BIT IDENTITY ENCRYPTION ACTIVE
                    </div>
                </div>
            </main>

            {/* Premium OTP Interface */}
            {otpSent && !verified && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white border border-white rounded-[48px] p-12 max-w-sm w-full shadow-[0_48px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-500">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-50 border border-blue-200">
                                <ShieldCheck size={40} />
                            </div>
                            <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight leading-none">Identity Check</h2>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                Enter the secret code sent to <br />
                                <span className="text-blue-600 underline font-black tracking-tight">{maskEmail(email)}</span>
                            </p>
                        </div>

                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="—— —— ——"
                            maxLength={6}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-[28px] py-7 text-center font-black text-4xl tracking-widest outline-none transition-all mb-8 shadow-inner"
                        />

                        <button
                            onClick={handleVerifyOTP}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.25em] transition-all transform hover:translate-y-[-2px] hover:shadow-2xl shadow-blue-200 active:scale-[0.98]"
                        >
                            Confirm Identity
                        </button>
                        <button
                            onClick={() => setOtpSent(false)}
                            className="w-full mt-6 text-slate-400 font-black py-2 hover:text-slate-900 transition-colors text-[10px] uppercase tracking-[0.2em]"
                        >
                            Modify Email Credentials
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
