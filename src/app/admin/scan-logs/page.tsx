"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Download,
    Clock,
    MapPin,
    Smartphone,
    AlertTriangle,
    History,
    QrCode
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ScanLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('scan_logs')
                .select(`
                    *,
                    qr_codes (vehicle_number, owner_name)
                `)
                .order('created_at', { ascending: false });

            if (data) {
                setLogs(data);
                setFilteredLogs(data);
            }
            setLoading(false);
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredLogs(logs);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = logs.filter(log =>
            log.qr_codes?.vehicle_number.toLowerCase().includes(lowerTerm) ||
            log.qr_codes?.owner_name?.toLowerCase().includes(lowerTerm) ||
            log.scanner_ip?.toLowerCase().includes(lowerTerm) ||
            log.scanner_identifier?.toLowerCase().includes(lowerTerm) ||
            log.scan_type.toLowerCase().includes(lowerTerm)
        );
        setFilteredLogs(filtered);
    }, [searchTerm, logs]);

    const handleExport = () => {
        // Simple CSV Export
        const headers = ["Time", "Vehicle", "Owner", "Type", "Scanner Identity", "IP", "Status"];
        const rows = filteredLogs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.qr_codes?.vehicle_number || "Unknown",
            log.qr_codes?.owner_name || "-",
            log.scan_type,
            log.scanner_identifier || "Anonymous",
            log.scanner_ip || "Unknown IP",
            log.otp_verified ? "Verified" : "Bypassed"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Scan_Logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Scan History</h1>
                    <p className="text-gray-500 mt-1">Real-time log of all vehicle interactions and alerts.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Filters/Search */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by vehicle, owner, email or IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-6">Event Time</th>
                                <th className="px-8 py-6">Vehicle</th>
                                <th className="px-8 py-6">Interaction</th>
                                <th className="px-8 py-6">Scanner</th>
                                <th className="px-8 py-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                        Fetching scan logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold italic">
                                        No scan activity found.
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-gray-300" />
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{new Date(log.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-gray-400 font-black tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-gray-800 leading-tight">{(log.qr_codes as any)?.vehicle_number || 'Unknown'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{(log.qr_codes as any)?.owner_name || '-'}</p>
                                    </td>
                                    <td className="px-8 py-6 uppercase tracking-widest text-[10px] font-black">
                                        <span className={`px-2 py-1 rounded-md ${log.scan_type === 'emergency' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {log.scan_type === 'emergency' ? 'Emergency Alert' :
                                                log.contact_method === 'message' ? 'Secure Message' :
                                                    log.contact_method === 'call' ? 'Call Request' :
                                                        'QR Scan'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            {log.scanner_identifier ? (
                                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                                    <Smartphone size={14} />
                                                    <span className="font-bold text-xs">{log.scanner_identifier}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-bold italic">Anonymous</span>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-medium">
                                                <MapPin size={10} />
                                                <span>{log.scanner_ip || 'Unknown IP'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${log.otp_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {log.otp_verified ? 'Verified' : 'Bypassed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">
                        Synchronizing Logs...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center">
                        <History className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-bold italic">No logs found.</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.scan_type === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {log.scan_type === 'emergency' ? <AlertTriangle size={20} /> : <QrCode size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 leading-tight">{(log.qr_codes as any)?.vehicle_number || 'Unknown'}</h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{log.scan_type} Interaction</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${log.otp_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {log.otp_verified ? 'Verified' : 'Bypassed'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-300">
                                        <Clock size={10} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-300">
                                        <Smartphone size={10} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Identity</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 truncate">{log.scanner_identifier || log.scanner_ip || 'Anonymous'}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
