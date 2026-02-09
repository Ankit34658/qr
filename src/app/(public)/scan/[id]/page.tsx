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
    AlertCircle,
    Send,
    CheckCircle2,
    XCircle
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
    const [token, setToken] = useState<string | null>(null);
    const [relayMessage, setRelayMessage] = useState("");
    const [relayLoading, setRelayLoading] = useState(false);

    // Modal System State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        priority?: 'high' | 'normal' | 'success';
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: ''
    });

    const showModal = (config: Omit<typeof modalConfig, 'isOpen'>) => {
        setModalConfig({ ...config, isOpen: true });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

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
                    qr_id: qrCode?.id
                })
            });
            const data = await response.json();
            if (data.success) {
                setOtpSent(true);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            showModal({
                type: 'alert',
                title: 'Request Failed',
                message: err.message,
                priority: 'normal'
            });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            showModal({
                type: 'alert',
                title: 'Invalid Code',
                message: "Please enter a valid 6-digit code sent to your email.",
                priority: 'normal'
            });
            return;
        }

        setOtpLoading(true);
        try {
            const response = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp_code: otp,
                    qr_id: qrCode?.id
                })
            });

            const data = await response.json();
            if (data.success) {
                setToken(data.token);
                setVerified(true);
                setOtpSent(false);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            showModal({
                type: 'alert',
                title: 'Verification Error',
                message: err.message,
                priority: 'normal'
            });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleRelay = async (method: 'call' | 'message') => {
        if (!token) {
            showModal({
                type: 'alert',
                title: 'Session Expired',
                message: "Your secure session has expired. Please verify again.",
                priority: 'normal',
                onConfirm: () => {
                    setVerified(false);
                    setOtpSent(false);
                }
            });
            return;
        }

        if (method === 'message' && !relayMessage.trim()) {
            showModal({
                type: 'alert',
                title: 'Message Required',
                message: "Please enter a message for the owner.",
                priority: 'normal'
            });
            return;
        }

        setRelayLoading(true);
        try {
            const response = await fetch('/api/contact/relay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    method,
                    message: relayMessage
                })
            });

            const data = await response.json();
            if (data.success) {
                showModal({
                    type: 'alert',
                    title: 'Relay Successful',
                    message: "Your request has been relayed to the owner securely. They will contact you via email shortly.",
                    priority: 'success'
                });
                setRelayMessage("");
            } else {
                throw new Error(data.error || 'Relay failed');
            }
        } catch (err: any) {
            showModal({
                type: 'alert',
                title: 'Relay Error',
                message: err.message,
                priority: 'normal'
            });
        } finally {
            setRelayLoading(false);
        }
    };

    const triggerEmergencyBroadcast = async () => {
        let location = null;
        try {
            // Try to get location
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                console.warn("GPS Warning: HTTP connection blocks Geolocation.");
                showModal({
                    type: 'confirm',
                    title: 'Location Unavailable',
                    message: "GPS requires a secure connection (HTTPS). Sending alert without location data. Continue?",
                    priority: 'normal',
                    onConfirm: async () => {
                        await sendEmergencyAlert(null);
                    }
                });
                return;
            }

            if ("geolocation" in navigator) {
                try {
                    console.log("Attempting to fetch GPS location...");

                    // Create a promise that rejects on timeout
                    const getPosition = new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        });
                    });

                    const position = await getPosition;
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log("GPS Location acquired:", location);

                } catch (e: any) {
                    console.warn("Location access denied or timed out:", e);

                    let errorMsg = "Could not fetch location.";
                    if (e.code === 1) errorMsg = "Location permission denied.";
                    if (e.code === 2) errorMsg = "Location unavailable/Signal lost.";
                    if (e.code === 3) errorMsg = "Location request timed out.";

                    // Optional: Ask user to retry or proceed
                    showModal({
                        type: 'confirm',
                        title: 'GPS Failed',
                        message: `${errorMsg} Send alert without map location?`,
                        priority: 'high',
                        onConfirm: async () => {
                            await sendEmergencyAlert(null);
                        }
                    });
                    return; // Stop here, wait for user confirmation to proceed without GPS
                }
            }

            await sendEmergencyAlert(location);

        } catch (err: any) {
            showModal({
                type: 'alert',
                title: 'Broadcast Error',
                message: "System delay. Please call emergency services (100/108).",
                priority: 'high'
            });
        }
    };

    const sendEmergencyAlert = async (location: any) => {
        try {
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
                showModal({
                    type: 'alert',
                    title: 'Alert Broadcasted',
                    message: "The vehicle owner and emergency contacts have been notified. Location: " + (location ? "Attached" : "Not available") + ".",
                    priority: 'success'
                });
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            showModal({
                type: 'alert',
                title: 'Broadcast Error',
                message: err.message || "Failed to send alert.",
                priority: 'high'
            });
        }
    };

    const handleEmergency = () => {
        showModal({
            type: 'confirm',
            title: 'Confirm Emergency?',
            message: "CRITICAL ALERT: This will notify the owner and their emergency contacts immediately. Only proceed for genuine life-safety emergencies.",
            priority: 'high',
            onConfirm: triggerEmergencyBroadcast
        });
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
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-8 relative z-10 space-y-8">
                {/* Vehicle Hero Card */}
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
                        </div>
                    </div>
                </div>

                {/* Intelligent Guidelines */}
                <div className="bg-amber-50 border border-amber-200/50 rounded-[32px] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 ring-1 ring-amber-200/50">
                            <Info size={16} />
                        </div>
                        <h3 className="font-black text-amber-700 uppercase text-xs tracking-widest">Privacy Protocol</h3>
                    </div>
                    <p className="text-[10px] text-amber-900/60 font-bold leading-relaxed px-1">
                        We use an anonymous relay system. Your contact details and the owner's phone numbers are never shared directly.
                    </p>
                </div>

                {/* Interaction Modules */}
                <div className="space-y-6">
                    {/* Emergency Response System */}
                    {qrCode.emergency_enabled && (
                        <div className="bg-red-600 rounded-[32px] p-8 shadow-2xl shadow-red-200 relative overflow-hidden group transition-all border-t border-white/20">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                                    <AlertTriangle size={14} className="text-white animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Priority Level: High</span>
                                </div>
                                <h3 className="text-2xl font-black mb-1 text-white">Emergency?</h3>
                                <p className="text-red-50 text-sm mb-6 font-semibold opacity-80">Immediate broadcast to owner, family, and medical units.</p>

                                {qrCode.medical_contact && (
                                    <div className="mb-4 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Medical Contact Active</p>
                                        <p className="text-white font-bold text-xs">{qrCode.medical_contact_name || 'Family Doctor'}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleEmergency}
                                    className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-lg hover:shadow-2xl transition duration-300 transform active:scale-95"
                                >
                                    BROADCAST ALERT
                                </button>
                            </div>
                            <AlertTriangle className="absolute -bottom-6 -right-6 w-36 h-36 text-white/10 -rotate-12" />
                        </div>
                    )}

                    {/* Standard Secure Contact */}
                    <div className="bg-white rounded-[40px] px-8 py-10 border border-slate-100 shadow-sm ring-1 ring-slate-200/50">
                        {!verified ? (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-black text-slate-900 mb-1">Secure Contact</h3>
                                    <p className="text-slate-500 text-sm font-bold">Verify identity to reach the owner</p>
                                </div>

                                {/* Email Input Group */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-medium"
                                    />
                                </div>

                                <button
                                    onClick={handleSendOTP}
                                    disabled={otpLoading || !email || !email.includes('@')}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    {otpLoading && (
                                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white" size={20} />
                                        </div>
                                    )}
                                    <span className={otpLoading ? "opacity-0" : "opacity-100"}>Get Verification Code</span>
                                </button>

                                <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                                    We will send a 6-digit code to verify you are human.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-1.5 rounded-full mb-4 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Secure Session Active</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">How can we help?</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Contact the owner anonymously.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Virtual Number Display (Fake Masking) */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">SafeDrive Proxy Number</p>
                                            <p className="text-lg font-black text-slate-700 tracking-widest font-mono flex items-center gap-2">
                                                <Lock size={14} className="text-emerald-500" />
                                                +91 99****0070
                                            </p>
                                        </div>
                                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                            <ShieldCheck size={20} className="text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="bg-white p-1 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="bg-slate-50/50 p-4 rounded-[20px] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1 mb-2 block">Your Message</label>
                                            <textarea
                                                value={relayMessage}
                                                onChange={(e) => setRelayMessage(e.target.value)}
                                                placeholder="Example: Your car is blocking the gate, please move it."
                                                className="w-full bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300 min-h-[80px] resize-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleRelay('message')}
                                            disabled={relayLoading}
                                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition flex items-center justify-center gap-3 active:scale-95 transform"
                                        >
                                            {relayLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                            Send Secure Message
                                        </button>

                                        <div className="relative flex py-2 items-center">
                                            <div className="flex-grow border-t border-slate-100"></div>
                                            <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] font-black uppercase tracking-widest">Or Call</span>
                                            <div className="flex-grow border-t border-slate-100"></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleRelay('call')}
                                                disabled={relayLoading}
                                                className="bg-white text-blue-600 border border-blue-100 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2"
                                            >
                                                <Phone size={16} />
                                                Request Call Back
                                            </button>
                                            <a
                                                href={`tel:${qrCode.owner_mobile}`}
                                                className="bg-emerald-50 text-emerald-600 border border-emerald-100 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition flex flex-col items-center justify-center gap-2"
                                                onClick={(e) => {
                                                    if (!confirm("Privacy Notice: This will open your phone's dialer. The call will be routed through our system, but your dialer may show the destination number. Proceed?")) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <Lock size={12} />
                                                    <span>Masked Call</span>
                                                </div>
                                                <span className="text-[9px] opacity-70">Connect via Proxy</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* OTP Interface */}
            {otpSent && !verified && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
                    <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black mb-2 text-slate-900">Verify Identity</h2>
                            <p className="text-xs text-slate-500 font-bold">Code sent to {maskEmail(email)}</p>
                        </div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="—— —— ——"
                            maxLength={6}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-2xl py-6 text-center font-black text-3xl tracking-[0.5em] outline-none mb-6"
                        />
                        <button
                            onClick={handleVerifyOTP}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Verify & Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Premium Modal */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[8px]">
                    <div className="bg-white rounded-[48px] p-10 max-w-sm w-full shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border border-white/50 relative overflow-hidden">
                        {/* Decorative Background for High Priority */}
                        {modalConfig.priority === 'high' && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
                        )}
                        {modalConfig.priority === 'success' && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                        )}

                        <div className="text-center mb-8">
                            <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-6 shadow-xl relative group ${modalConfig.priority === 'high' ? 'bg-red-50 text-red-600 shadow-red-100' :
                                modalConfig.priority === 'success' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                                    'bg-blue-50 text-blue-600 shadow-blue-100'
                                }`}>
                                {modalConfig.priority === 'high' ? <AlertTriangle size={48} className="animate-bounce" /> :
                                    modalConfig.priority === 'success' ? <CheckCircle2 size={48} /> :
                                        <Info size={48} />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{modalConfig.title}</h2>
                            <p className="text-slate-500 font-bold text-sm leading-relaxed px-2">{modalConfig.message}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    if (modalConfig.onConfirm) {
                                        modalConfig.onConfirm();
                                    } else {
                                        closeModal();
                                    }
                                }}
                                className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-lg ${modalConfig.priority === 'high' ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700' :
                                    modalConfig.priority === 'success' ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' :
                                        'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                                    }`}
                            >
                                {modalConfig.type === 'confirm' ? 'Yes, Proceed' : 'Dismiss'}
                            </button>

                            {modalConfig.type === 'confirm' && (
                                <button
                                    onClick={closeModal}
                                    className="w-full bg-white text-slate-400 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:text-slate-600 transition-all border border-slate-100"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
