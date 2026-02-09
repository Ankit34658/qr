"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search,
    Filter,
    Download,
    Clock,
    MapPin,
    Smartphone,
    AlertTriangle,
    History,
    QrCode,
    TrendingUp,
    ShieldAlert,
    ScanLine,
    Loader2,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ScanLog {
    id: string;
    created_at: string;
    qr_code_id: string;
    scan_type: 'normal' | 'emergency';
    scanner_ip?: string;
    scanner_identifier?: string;
    otp_verified?: boolean;
    qr_codes?: {
        qr_unique_id: string;
        vehicle_number?: string;
        owner_name?: string;
        owner_mobile?: string;
        is_activated?: boolean;
    };
}

export default function ScanLogsPage() {
    const [logs, setLogs] = useState<ScanLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('scan_logs')
                    .select(`
                        *,
                        qr_codes (
                            qr_unique_id, 
                            vehicle_number, 
                            owner_name,
                            owner_mobile,
                            is_activated
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(500);

                if (error) throw error;

                if (data) {
                    setLogs(data as ScanLog[]);
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();

        // Set up real-time subscription
        const channel = supabase
            .channel('scan-logs-changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'scan_logs' },
                async (payload) => {
                    // Fetch the complete log with joined data
                    const { data } = await supabase
                        .from('scan_logs')
                        .select(`
                            *,
                            qr_codes (
                                qr_unique_id, 
                                vehicle_number, 
                                owner_name,
                                owner_mobile,
                                is_activated
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setLogs(prev => [data as ScanLog, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Derived Stats
    const stats = useMemo(() => {
        const total = logs.length;
        const emergency = logs.filter(l => l.scan_type === 'emergency').length;
        const uniqueVehicles = new Set(logs.map(l => l.qr_codes?.qr_unique_id).filter(Boolean)).size;
        const verifiedScans = logs.filter(l => l.otp_verified).length;

        return { total, emergency, uniqueVehicles, verifiedScans };
    }, [logs]);

    // Filtering Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = !searchTerm ||
                log.qr_codes?.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.qr_codes?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.qr_codes?.qr_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.scanner_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.scanner_identifier?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' ||
                (filterType === 'emergency' && log.scan_type === 'emergency') ||
                (filterType === 'normal' && log.scan_type === 'normal');

            return matchesSearch && matchesFilter;
        });
    }, [logs, searchTerm, filterType]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // CSV Export with BOM for Excel compatibility
            const BOM = '\uFEFF';
            const headers = ["ID", "Date", "Time", "Tag ID", "Vehicle", "Owner", "Mobile", "Interaction", "Scanner", "IP", "Status"];
            const rows = filteredLogs.map(log => [
                log.id,
                new Date(log.created_at).toLocaleDateString(),
                new Date(log.created_at).toLocaleTimeString(),
                log.qr_codes?.qr_unique_id || "N/A",
                log.qr_codes?.vehicle_number || "Unassigned",
                log.qr_codes?.owner_name || "-",
                log.qr_codes?.owner_mobile || "-",
                log.scan_type.toUpperCase(),
                log.scanner_identifier || "Anonymous",
                log.scanner_ip || "Unknown",
                log.otp_verified ? "Verified" : "Unverified"
            ]);

            const csvContent = BOM + [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Scan_History_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header with Live Pulse */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Scan History</h1>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Feed</span>
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium">Monitoring vehicle interactions across your fleet in real-time.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={isExporting || filteredLogs.length === 0}
                    className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-xl disabled:opacity-50 group"
                >
                    {isExporting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    )}
                    Export Logs
                </button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative space-y-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">Total Scans</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.total}</h3>
                            <p className="text-xs text-gray-400 mt-1">All time interactions</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative space-y-4">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">Emergency Alerts</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.emergency}</h3>
                            <p className="text-xs text-rose-500 font-semibold mt-1">Critical events</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <ScanLine size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">Active Vehicles</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.uniqueVehicles}</h3>
                            <p className="text-xs text-gray-400 mt-1">Unique tags scanned</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative space-y-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500">Verified Scans</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.verifiedScans}</h3>
                            <p className="text-xs text-gray-400 mt-1">OTP confirmed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative w-full lg:flex-grow">
                    <input
                        type="text"
                        placeholder="Search by Tag ID, Vehicle Number, Owner, or IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex w-full lg:w-auto p-1 bg-gray-50 rounded-xl">
                    {['all', 'normal', 'emergency'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`flex-1 lg:px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterType === type
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tag & Vehicle</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Owner Details</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event Type</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Scanner Info</th>
                                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-blue-600" size={32} />
                                            <p className="text-sm font-semibold text-gray-400">Loading scan logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <History size={48} className="text-gray-300" />
                                            <p className="text-sm font-semibold text-gray-400">No scan logs found</p>
                                            <p className="text-xs text-gray-400">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition duration-200">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(log.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                                                        <QrCode size={12} />
                                                        #{log.qr_codes?.qr_unique_id}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {log.qr_codes?.vehicle_number || 'UNASSIGNED'}
                                                </p>
                                                {!log.qr_codes?.is_activated && (
                                                    <span className="text-xs text-amber-600 font-medium">Not Activated</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {log.qr_codes?.owner_name || 'N/A'}
                                                </p>
                                                {log.qr_codes?.owner_mobile && (
                                                    <p className="text-xs text-gray-500">
                                                        +91 {log.qr_codes.owner_mobile}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${log.scan_type === 'emergency'
                                                    ? 'bg-rose-50 text-rose-600'
                                                    : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {log.scan_type === 'emergency' ? (
                                                    <AlertTriangle size={14} />
                                                ) : (
                                                    <ScanLine size={14} />
                                                )}
                                                <span className="text-xs font-bold uppercase">
                                                    {log.scan_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Smartphone size={14} className="text-gray-400" />
                                                    <span className="text-xs font-semibold">
                                                        {log.scanner_identifier || 'Anonymous'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin size={12} className="text-gray-400" />
                                                    <span className="text-xs">
                                                        {log.scanner_ip || 'Hidden'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${log.otp_verified
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.otp_verified ? 'bg-emerald-500' : 'bg-gray-400'
                                                    }`} />
                                                {log.otp_verified ? 'Verified' : 'Unverified'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-20 text-center">
                        <History size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-sm font-semibold text-gray-400">No scan logs found</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.scan_type === 'emergency'
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {log.scan_type === 'emergency' ? (
                                            <ShieldAlert size={24} />
                                        ) : (
                                            <QrCode size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-blue-500">
                                            Tag #{log.qr_codes?.qr_unique_id}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {log.qr_codes?.vehicle_number || 'UNASSIGNED'}
                                        </h3>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${log.otp_verified
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {log.otp_verified ? '✓' : '○'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500">Owner</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {log.qr_codes?.owner_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Time</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(log.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Scanner</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {log.scanner_identifier || 'Anonymous'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Event</p>
                                    <p className={`text-sm font-semibold ${log.scan_type === 'emergency' ? 'text-rose-600' : 'text-indigo-600'
                                        }`}>
                                        {log.scan_type.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}