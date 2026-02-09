"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    Users,
    QrCode,
    AlertTriangle,
    Car,
    Clock,
    ArrowRight,
    ShieldCheck,
    MessageSquare as MessageSquareIcon,
    Info,
    ExternalLink,
    MapPin
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
    const [stats, setStats] = useState([
        { label: "Total QR Codes", value: "0", icon: <QrCode />, color: "bg-blue-600", trend: "+0%" },
        { label: "Today's Scans", value: "0", icon: <Clock />, color: "bg-emerald-600", trend: "+0%" },
        { label: "Emergency Alerts", value: "0", icon: <AlertTriangle />, color: "bg-red-600", trend: "0%" },
        { label: "Active Vehicles", value: "0", icon: <Car />, color: "bg-purple-600", trend: "+0%" },
    ]);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [chartData, setChartData] = useState<{ day: string, count: number }[]>([]);
    const [typeData, setTypeData] = useState<{ name: string, count: number, color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMobileGuide, setShowMobileGuide] = useState(false);
    const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats
                const { count: qrCount } = await supabase.from('qr_codes').select('*', { count: 'exact', head: true });
                const { count: emergencyCount } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scan_type', 'emergency');

                // Get today's start date
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { count: todayScanCount } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', todayStart.toISOString());

                const { count: scanCount } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true });

                setStats([
                    { label: "Total QR Codes", value: qrCount?.toString() || "0", icon: <QrCode />, color: "bg-blue-600", trend: "+0%" },
                    { label: "Today's Scans", value: todayScanCount?.toString() || "0", icon: <Clock />, color: "bg-emerald-600", trend: "+0%" },
                    { label: "Emergency Alerts", value: emergencyCount?.toString() || "0", icon: <AlertTriangle />, color: "bg-red-600", trend: "0%" },
                    { label: "Total Scans", value: scanCount?.toString() || "0", icon: <TrendingUp />, color: "bg-purple-600", trend: "+0%" },
                ]);

                // Fetch recent scans
                const { data: scans } = await supabase
                    .from('scan_logs')
                    .select(`
                        id,
                        scan_type,
                        created_at,
                        qr_codes (vehicle_number)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (scans) setRecentScans(scans);

                // Fetch chart data (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { data: chartRaw } = await supabase
                    .from('scan_logs')
                    .select('created_at')
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (chartRaw) {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const counts: Record<string, number> = {};

                    // Initialize last 7 days
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        counts[days[d.getDay()]] = 0;
                    }

                    chartRaw.forEach(log => {
                        const dayName = days[new Date(log.created_at).getDay()];
                        if (counts[dayName] !== undefined) counts[dayName]++;
                    });

                    setChartData(Object.entries(counts).map(([day, count]) => ({ day, count })));
                }

                // Fetch scan type distribution
                const { data: typeRaw } = await supabase.from('scan_logs').select('scan_type');
                if (typeRaw) {
                    const normalCount = typeRaw.filter(s => s.scan_type === 'normal').length;
                    const emergencyCount = typeRaw.filter(s => s.scan_type === 'emergency').length;
                    setTypeData([
                        { name: 'Normal Scans', count: normalCount, color: 'bg-blue-500' },
                        { name: 'Emergency', count: emergencyCount, color: 'bg-red-500' }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchActiveAlerts = async () => {
            try {
                const { data: alerts } = await supabase
                    .from('emergency_alerts')
                    .select('*, qr_codes(vehicle_number, vehicle_make, vehicle_model, owner_name, owner_mobile, emergency_contact_1, emergency_contact_1_name)')
                    .eq('resolved', false)
                    .order('created_at', { ascending: false });

                if (alerts) setActiveAlerts(alerts);
            } catch (error) {
                console.error("Error fetching alerts:", error);
            }
        };

        // Initial fetch
        fetchDashboardData();
        fetchActiveAlerts();

        // Poll for alerts every 5 seconds
        const interval = setInterval(fetchActiveAlerts, 5000);
        return () => clearInterval(interval);

    }, []);

    const handleResolveAlert = async () => {
        if (!selectedAlert) return;
        setResolving(true);
        try {
            const { error } = await supabase
                .from('emergency_alerts')
                .update({
                    resolved: true,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', selectedAlert.id);

            if (error) throw error;

            // Remove from local state
            setActiveAlerts(prev => prev.filter(a => a.id !== selectedAlert.id));
            setSelectedAlert(null);

            // Refund/Update Stats locally for immediate feedback
            setStats(prev => prev.map(s => s.label === "Emergency Alerts" ? { ...s, value: (parseInt(s.value) - 1).toString() } : s));

        } catch (err) {
            console.error("Failed to resolve alert:", err);
            alert("Failed to resolve alert. Please try again.");
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fadeIn pb-10">
            {/* RED ALERT BANNER */}
            {activeAlerts.length > 0 && (
                <div className="bg-red-600 rounded-[32px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-200 animate-pulse border-4 border-red-400">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-black text-xl uppercase tracking-tight">System Critical: Red Alert</h4>
                            <p className="text-sm font-bold opacity-90">
                                {activeAlerts.length} active emergency {activeAlerts.length === 1 ? 'alert' : 'alerts'} detected.
                                <span className="ml-2 font-black underline">Vehicle: {activeAlerts[0]?.qr_codes?.vehicle_number}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedAlert(activeAlerts[0])}
                        className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition shadow-xl shrink-0"
                    >
                        Respond Now
                    </button>
                </div>
            )}

            {/* Emergency Resolution Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto pt-10 md:pt-20">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative mb-20">
                        <div className="bg-red-600 text-white p-6 md:p-8 flex justify-between items-center z-20 relative">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <AlertTriangle size={32} className="animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Emergency Command Center</h2>
                                    <p className="opacity-90 font-bold text-sm">Incident ID: {selectedAlert.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 grid md:grid-cols-2 gap-8">
                            {/* Map & Location */}
                            <div className="space-y-6">
                                <div className="bg-gray-100 rounded-[32px] aspect-video w-full overflow-hidden border border-gray-200 relative group">
                                    {selectedAlert.location_lat ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            style={{ border: 0 }}
                                            src={`https://maps.google.com/maps?q=${selectedAlert.location_lat},${selectedAlert.location_lng}&z=15&output=embed`}
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">
                                            <MapPin size={48} className="mb-2" />
                                            <p>No GPS Data Available</p>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                                        📍 Incident Location
                                    </div>
                                </div>

                                <div className="bg-red-50 p-6 rounded-[32px] border border-red-100">
                                    <h3 className="text-red-800 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Dispatch Log
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedAlert.alert_sent_to && selectedAlert.alert_sent_to.map((contact: string, i: number) => (
                                            <div key={i} className="flex items-center gap-3 text-sm font-bold text-red-900/70 p-2 bg-white rounded-xl border border-red-100/50">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                Sent to: <span className="text-red-900">{contact}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Contact Info */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-gray-400 font-black uppercase tracking-widest text-xs mb-4">Vehicle Details</h3>
                                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-3xl font-black text-gray-900">{selectedAlert.qr_codes?.vehicle_number}</p>
                                            <p className="text-gray-500 font-bold">{selectedAlert.qr_codes?.vehicle_make} {selectedAlert.qr_codes?.vehicle_model}</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400">
                                            <Car size={32} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-gray-400 font-black uppercase tracking-widest text-xs mb-4">Emergency Contacts</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-blue-600">Owner</p>
                                                    <p className="font-bold text-gray-900">{selectedAlert.qr_codes?.owner_name}</p>
                                                </div>
                                            </div>
                                            <a href={`tel:${selectedAlert.qr_codes?.owner_mobile}`} className="relative z-10 bg-white p-3 px-5 rounded-xl text-blue-600 shadow-sm font-black text-xs hover:bg-blue-600 hover:text-white transition uppercase tracking-widest border border-blue-100">
                                                CALL OWNER
                                            </a>
                                        </div>

                                        {selectedAlert.qr_codes?.emergency_contact_1 && (
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-sm">
                                                        <Users size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-gray-400">{selectedAlert.qr_codes?.emergency_contact_1_name || 'Contact 1'}</p>
                                                        <p className="font-bold text-gray-900">{selectedAlert.qr_codes?.emergency_contact_1}</p>
                                                    </div>
                                                </div>
                                                <a href={`tel:${selectedAlert.qr_codes?.emergency_contact_1}`} className="relative z-10 bg-white p-3 px-5 rounded-xl text-gray-600 shadow-sm font-black text-xs hover:bg-gray-900 hover:text-white transition uppercase tracking-widest border border-gray-100">
                                                    CALL
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleResolveAlert}
                                        disabled={resolving}
                                        className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition flex items-center justify-center gap-3"
                                    >
                                        {resolving ? <Clock className="animate-spin" /> : <ShieldCheck size={20} />}
                                        {resolving ? 'Resolving...' : 'Mark Alert as Resolved'}
                                    </button>
                                    <p className="text-center text-xs text-gray-400 font-bold mt-4">
                                        This will archive the alert and remove the dashboard banner.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Local Testing Guide Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4 text-amber-700">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg">Localhost Testing Hub</h4>
                        <p className="text-sm font-medium opacity-80">Testing on mobile? Use <span className="font-bold underline">PC Browser</span> or your PC's Wi-Fi IP address.</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowMobileGuide(true)}
                        className="flex-grow md:flex-initial bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition"
                    >
                        Setup Mobile Access
                    </button>
                    <Link href="/admin/qr-codes" className="flex-grow md:flex-initial bg-white text-amber-600 px-5 py-3 rounded-xl font-bold text-sm border border-amber-200 hover:bg-amber-100 transition text-center flex items-center justify-center gap-2">
                        <ExternalLink size={16} />
                        Quick Test Scanning
                    </Link>
                </div>
            </div>

            {/* Mobile Setup Modal */}
            {showMobileGuide && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center">
                                    <Info size={32} />
                                </div>
                                <button onClick={() => setShowMobileGuide(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                                    <Clock size={24} className="rotate-45 text-gray-400" />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2">Localhost Mobile Testing</h3>
                            <p className="text-gray-500 font-medium mb-8">Scan QR codes from your phone while developing locally.</p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">1</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Find your Local IP</p>
                                        <p className="text-xs text-gray-400 mt-1">Run <code className="bg-gray-100 px-1 rounded">ipconfig</code></p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">2</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Ensure Same Wi-Fi</p>
                                        <p className="text-xs text-gray-400 mt-1">Your mobile phone and PC must be on the same network.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowMobileGuide(false)}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-10 hover:bg-gray-800 transition shadow-lg"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[32px] p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">Morning, Admin! 👋</h1>
                    <p className="opacity-80 max-w-sm text-sm md:text-base font-medium">
                        Everything looks good today. System is active and protecting {stats[0].value} vehicles.
                    </p>
                </div>
                <Link href="/admin/reports" className="relative z-10 w-full md:w-auto bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition text-center text-sm">
                    Generate Report
                </Link>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover-lift">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg`}>
                                {stat.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Charts & Activity Section */}
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                {/* Scan Activity Chart */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Scan Activity</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last 7 Days</p>
                        </div>
                        <TrendingUp className="text-emerald-500" size={20} />
                    </div>

                    <div className="flex-grow flex items-end justify-between gap-2 min-h-[250px] pb-6 px-2">
                        {chartData.map((data, i) => {
                            const maxCount = Math.max(...chartData.map(d => d.count), 5);
                            const height = (data.count / maxCount) * 100;
                            return (
                                <div key={i} className="flex-grow flex flex-col items-center gap-3 group">
                                    <div className="relative w-full flex justify-center items-end h-48">
                                        <div
                                            style={{ height: `${height}%` }}
                                            className={`w-full max-w-[24px] rounded-full transition-all duration-1000 ${i === chartData.length - 1 ? 'bg-blue-600 shadow-lg' : 'bg-blue-100 group-hover:bg-blue-200'}`}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                            {data.count} scans
                                        </div>
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-tight ${i === chartData.length - 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {data.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scan Distribution */}
                <div className="lg:col-span-1 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black text-gray-900 mb-2">Scan Distribution</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-8">Overall Stats</p>

                    <div className="relative flex-grow flex items-center justify-center py-6">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-50" strokeWidth="3" />
                                {(() => {
                                    const total = typeData.reduce((acc, d) => acc + d.count, 0) || 1;
                                    let offset = 0;
                                    return typeData.map((d, i) => {
                                        const percent = (d.count / total) * 100;
                                        const dash = `${percent} ${100 - percent}`;
                                        const currentOffset = offset;
                                        offset -= percent;
                                        return (
                                            <circle
                                                key={i}
                                                cx="18" cy="18" r="16" fill="none"
                                                className={i === 0 ? "stroke-blue-600" : "stroke-red-500"}
                                                strokeWidth="3.5"
                                                strokeDasharray={dash}
                                                strokeDashoffset={currentOffset}
                                                strokeLinecap="round"
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <p className="text-3xl font-black text-gray-900 leading-none">
                                    {typeData.reduce((acc, d) => acc + d.count, 0)}
                                </p>
                                <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">Total Scans</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-6">
                        {typeData.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${d.color}`} />
                                    <span className="text-xs font-bold text-gray-600">{d.name}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-3 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 flex justify-between items-center bg-white border-b border-gray-50">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Scans Activity</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Live tracking of system interactions</p>
                        </div>
                        <Link href="/admin/scan-logs" className="bg-gray-50 hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition">
                            View Full Logs <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Vehicle Plate</th>
                                    <th className="px-8 py-5">Scan Type</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center animate-pulse">Loading...</td></tr>
                                ) : recentScans.length === 0 ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center italic">No scans recorded</td></tr>
                                ) : recentScans.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition">
                                        <td className="px-8 py-6 font-black text-gray-900">{(row.qr_codes as any)?.vehicle_number || 'Unknown'}</td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${row.scan_type === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {row.scan_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-emerald-600 text-[10px] uppercase">Logged</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
