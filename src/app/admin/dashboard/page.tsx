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
    ExternalLink
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

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-6 md:space-y-8 animate-fadeIn">
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
                                        <p className="text-xs text-gray-400 mt-1">Run <code className="bg-gray-100 px-1 rounded">ipconfig</code> on Windows or <code className="bg-gray-100 px-1 rounded">ifconfig</code> on Mac inside your terminal.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">2</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Ensure Same Wi-Fi</p>
                                        <p className="text-xs text-gray-400 mt-1">Your mobile phone and PC must be connected to the exact same Wi-Fi network.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">3</div>
                                    <div>
                                        <p className="font-bold text-gray-900">Access via IP</p>
                                        <p className="text-xs text-gray-400 mt-1">Open <code className="bg-gray-100 px-1 rounded font-bold text-blue-600">http://[YOUR-IP]:3000</code> in your mobile browser.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowMobileGuide(false)}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-10 hover:bg-gray-800 transition shadow-lg"
                            >
                                Got it, let's test!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[32px] p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-blue-100 relative overflow-hidden">
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
                            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-blue-100`}>
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
                                            className={`w-full max-w-[24px] rounded-full transition-all duration-1000 ${i === chartData.length - 1 ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-blue-100 group-hover:bg-blue-200'}`}
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

                {/* Activity Feed - Wide Version */}
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
                    <div className="overflow-x-auto lg:overflow-x-visible">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Vehicle Plate</th>
                                    <th className="px-8 py-5">Scan Type</th>
                                    <th className="px-8 py-5">Detection Time</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                            Syncing recent activity...
                                        </td>
                                    </tr>
                                ) : recentScans.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-gray-400 font-bold italic">
                                            No recent scans recorded.
                                        </td>
                                    </tr>
                                ) : recentScans.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                                                    {(row.qr_codes as any)?.vehicle_number?.slice(-2) || '??'}
                                                </div>
                                                <span className="font-black text-gray-900">{(row.qr_codes as any)?.vehicle_number || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider ${row.scan_type === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {row.scan_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-medium text-gray-500">
                                            {new Date(row.created_at).toLocaleDateString()} at {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                                                <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />
                                                Logged
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-1 bg-blue-600 rounded-[32px] p-8 text-white text-center relative overflow-hidden shadow-xl shadow-blue-100/50 hover-lift">
                    <QrCode className="w-24 h-24 opacity-10 absolute -bottom-4 -right-4 rotate-12" />
                    <h3 className="font-black text-xl mb-3 relative z-10">Deploy New Tag</h3>
                    <p className="text-sm opacity-80 mb-8 relative z-10 font-medium">Protect a new vehicle in under 60 seconds.</p>
                    <Link href="/admin/qr-codes/create" className="block w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition shadow-lg relative z-10">
                        Create Now
                    </Link>
                </div>

                <div className="lg:col-span-1 bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="font-black text-gray-900 mb-6 px-2 tracking-tight">Security Center</h3>
                    <div className="space-y-2 flex-grow">
                        <Link href="/admin/settings" className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition group border border-transparent hover:border-gray-50">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 text-sm">Two-Factor Auth</h4>
                                <p className="text-xs text-gray-400 font-medium">Enhance portal security</p>
                            </div>
                        </Link>
                        <Link href="mailto:support@safedrive.com" className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition group border border-transparent hover:border-gray-50">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                <MessageSquareIcon size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 text-sm">System Support</h4>
                                <p className="text-xs text-gray-400 font-medium">24/7 Expert assistance</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Status Mock */}
                <div className="lg:col-span-1 bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Status</span>
                        </div>
                        <h3 className="font-black text-xl mb-6">Global Infrastructure</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-xs font-bold opacity-60">API Latency</span>
                                <span className="text-xs font-black">24ms</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-xs font-bold opacity-60">Database Load</span>
                                <span className="text-xs font-black">12%</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-xs font-bold opacity-60">Uptime</span>
                                <span className="text-xs font-black">99.99%</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full" />
                </div>
            </div>
        </div>
    );
}
