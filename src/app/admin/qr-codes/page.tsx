"use client";

import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    QrCode as QrIcon,
    ExternalLink,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode as QRCodeType } from "@/types";
import QRCode from "qrcode";

export default function QrCodesPage() {
    const [qrCodes, setQrCodes] = useState<QRCodeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
    const [openDownloadId, setOpenDownloadId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const filterRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDownloadId(null);
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
        };

        if (openDownloadId || showFilterDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDownloadId, showFilterDropdown]);

    useEffect(() => {
        const fetchQRs = async () => {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setQrCodes(data as QRCodeType[]);
                // Generate QR code previews
                const urls: Record<string, string> = {};
                for (const qr of data) {
                    try {
                        const scanUrl = `${window.location.origin}/scan/${qr.qr_unique_id}`;
                        const dataUrl = await QRCode.toDataURL(scanUrl, {
                            width: 200,
                            margin: 1,
                        });
                        urls[qr.id] = dataUrl;
                    } catch (err) {
                        console.error('Error generating QR preview:', err);
                    }
                }
                setQrDataUrls(urls);
            }
            setLoading(false);
        };

        fetchQRs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this QR code?")) return;

        const { error } = await supabase
            .from('qr_codes')
            .delete()
            .eq('id', id);

        if (!error) {
            setQrCodes(prev => prev.filter(q => q.id !== id));
        }
    };

    const handleDownload = async (qr: QRCodeType, format: 'png' | 'svg' | 'pdf' = 'png') => {
        setDownloading(qr.id);
        try {
            const scanUrl = `${window.location.origin}/scan/${qr.qr_unique_id}`;

            if (format === 'png') {
                const qrDataUrl = await QRCode.toDataURL(scanUrl, {
                    width: 1024,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#ffffff"
                    }
                });

                const link = document.createElement("a");
                link.href = qrDataUrl;
                link.download = `SafeDrive_QR_${qr.vehicle_number.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'svg') {
                const qrSvg = await QRCode.toString(scanUrl, {
                    type: 'svg',
                    width: 1024,
                    margin: 2,
                });

                const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `SafeDrive_QR_${qr.vehicle_number.replace(/\s+/g, '_')}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else if (format === 'pdf') {
                // For PDF, we'll use PNG and let user print to PDF
                const qrDataUrl = await QRCode.toDataURL(scanUrl, {
                    width: 2048,
                    margin: 4,
                });

                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>QR Code - ${qr.vehicle_number}</title>
                                <style>
                                    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                    img { max-width: 100%; height: auto; }
                                </style>
                            </head>
                            <body>
                                <img src="${qrDataUrl}" alt="QR Code" />
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => printWindow.print(), 250);
                }
            }
        } catch (err) {
            console.error("Failed to download QR:", err);
            alert("Error generating download. Please try again.");
        } finally {
            setDownloading(null);
        }
    };


    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">QR Code Tags</h1>
                    <p className="text-gray-500 mt-1">Manage all your vehicle safety tags and their settings.</p>
                </div>
                <Link href="/admin/qr-codes/create" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                    <Plus size={20} />
                    Create New QR
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by vehicle number or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                        <Filter size={18} />
                        {statusFilter === "all" ? "All Tags" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </button>
                    {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                            {['all', 'active', 'paused'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setShowFilterDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {status === 'all' ? 'All Tags' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {loading ? (
                    <div className="col-span-full py-24 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Synchronizing Badges...
                    </div>
                ) : qrCodes.length === 0 ? (
                    <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[48px] border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto text-gray-300">
                            <QrIcon size={48} />
                        </div>
                        <div>
                            <p className="text-gray-900 font-black text-xl tracking-tight">Fleet Empty</p>
                            <p className="text-gray-400 font-medium mt-1">Deploy your first safety tag to start protecting vehicles.</p>
                        </div>
                        <Link href="/admin/qr-codes/create" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100">
                            <Plus size={20} />
                            Deploy Initial Tag
                        </Link>
                    </div>
                ) : qrCodes.filter(qr => {
                    const matchesSearch = qr.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        qr.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter === "all" || qr.status === statusFilter;
                    return matchesSearch && matchesStatus;
                }).map((qr) => (
                    <div key={qr.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 group flex flex-col hover:-translate-y-2 relative overflow-hidden">
                        {/* Status Ribbon */}
                        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-[24px] text-[10px] font-black uppercase tracking-widest ${qr.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                            {qr.status}
                        </div>

                        <div className="p-8 flex-grow">
                            {/* QR Preview Area */}
                            <div className="flex justify-center mb-8 pt-4">
                                <div className="relative group/qr">
                                    <div className="absolute -inset-2 bg-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover/qr:opacity-100 transition duration-500"></div>
                                    <div className="relative bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-transform duration-500 group-hover/qr:scale-105">
                                        {qrDataUrls[qr.id] ? (
                                            <img src={qrDataUrls[qr.id]} alt="QR Preview" className="w-28 h-28" />
                                        ) : (
                                            <div className="w-28 h-28 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <QrIcon size={32} className="text-gray-200" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Vehicle Identity</p>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1 uppercase font-mono">{qr.vehicle_number}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                        {qr.vehicle_make} {qr.vehicle_model}
                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                        {qr.owner_name}
                                    </p>
                                </div>

                                {/* Action Matrix */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDownloadId(openDownloadId === qr.id ? null : qr.id)}
                                            disabled={downloading === qr.id}
                                            className="w-full h-14 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-600 rounded-2xl transition-all flex items-center justify-center gap-3 font-bold text-xs group/btn"
                                        >
                                            {downloading === qr.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />}
                                            <span>Export</span>
                                        </button>

                                        {openDownloadId === qr.id && (
                                            <div ref={dropdownRef} className="absolute left-0 bottom-full mb-3 w-56 bg-white rounded-[28px] shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                <div className="p-3">
                                                    <p className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">Download Badge</p>
                                                    <div className="space-y-1">
                                                        <button
                                                            onClick={() => { handleDownload(qr, 'png'); setOpenDownloadId(null); }}
                                                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition flex items-center justify-between group/opt"
                                                        >
                                                            <span>PNG Image</span>
                                                            <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase font-black">HD</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { handleDownload(qr, 'svg'); setOpenDownloadId(null); }}
                                                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition flex items-center justify-between group/opt"
                                                        >
                                                            <span>SVG Vector</span>
                                                            <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase font-black">PRO</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { handleDownload(qr, 'pdf'); setOpenDownloadId(null); }}
                                                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition flex items-center justify-between group/opt"
                                                        >
                                                            <span>PDF Doc</span>
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase font-black">A4</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Link
                                        href={`/scan/${qr.qr_unique_id}`}
                                        target="_blank"
                                        className="h-14 bg-gray-50 hover:bg-slate-900 hover:text-white text-gray-600 rounded-2xl transition-all flex items-center justify-center gap-3 font-bold text-xs"
                                    >
                                        <ExternalLink size={18} />
                                        <span>Preview</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Tactical Footer Actions */}
                        <div className="flex divide-x divide-gray-100 border-t border-gray-50 bg-gray-50/30">
                            <Link
                                href={`/admin/qr-codes/${qr.qr_unique_id}`}
                                className="flex-1 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                            >
                                Edit Settings
                            </Link>
                            <button
                                onClick={() => handleDelete(qr.id)}
                                className="px-6 py-4 text-red-400 hover:bg-red-500 hover:text-white transition-all group/del"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
