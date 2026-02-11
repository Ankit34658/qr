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
    Loader2,
    CheckSquare,
    Square,
    Printer,
    FileDown,
    XCircle,
    Package,
    PowerOff
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
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [bulkQuantity, setBulkQuantity] = useState(5);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const filterRef = useRef<HTMLDivElement | null>(null);
    const [showBulkInput, setShowBulkInput] = useState(false);

    // Helpers
    const isLatest = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        return diff < 60 * 60 * 1000; // 60 minutes
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredQRs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredQRs.map(q => q.id));
        }
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    // Filtered QR codes - MODIFIED: Search by QR code number (qr_unique_id)
    const filteredQRs = qrCodes.filter(qr => {
        const matchesSearch = (qr.qr_unique_id || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || qr.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
        };

        if (showFilterDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showFilterDropdown]);

    useEffect(() => {
        const fetchQRs = async () => {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setQrCodes(data as QRCodeType[]);
                // Generate QR code previews
                const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
                const urls: Record<string, string> = {};
                for (const qr of data) {
                    try {
                        const scanUrl = `${appUrl}/${qr.qr_unique_id}`;
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
            setSelectedIds(prev => prev.filter(sid => sid !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} selected QR codes? This cannot be undone.`)) return;

        const { error } = await supabase
            .from('qr_codes')
            .delete()
            .in('id', selectedIds);

        if (!error) {
            setQrCodes(prev => prev.filter(q => !selectedIds.includes(q.id)));
            setSelectedIds([]);
        }
    };

    const handleSingleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: 1,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh list
                const { data: newData } = await supabase
                    .from('qr_codes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (newData) {
                    setQrCodes(newData as QRCodeType[]);
                    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
                    const urls: Record<string, string> = {};
                    for (const qr of newData) {
                        const scanUrl = `${appUrl}/${qr.qr_unique_id}`;
                        const dataUrl = await QRCode.toDataURL(scanUrl, { width: 200, margin: 1 });
                        urls[qr.id] = dataUrl;
                    }
                    setQrDataUrls(urls);
                }
            } else {
                throw new Error(data.error || "Failed to generate QR code");
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkGenerate = async () => {
        if (bulkQuantity < 1 || bulkQuantity > 100) return;

        setBulkLoading(true);
        try {
            const response = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: bulkQuantity,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh list
                const { data: newData } = await supabase
                    .from('qr_codes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (newData) {
                    setQrCodes(newData as QRCodeType[]);
                    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
                    const urls: Record<string, string> = {};
                    for (const qr of newData) {
                        const scanUrl = `${appUrl}/${qr.qr_unique_id}`;
                        const dataUrl = await QRCode.toDataURL(scanUrl, { width: 200, margin: 1 });
                        urls[qr.id] = dataUrl;
                    }
                    setQrDataUrls(urls);
                }
                setShowBulkInput(false);
                setBulkQuantity(5);
            } else {
                throw new Error(data.error || "Failed to generate QR codes");
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDeactivate = async (qr: QRCodeType) => {
        if (!confirm('Are you sure you want to deactivate this QR code? The data will remain but user can edit it.')) return;

        try {
            const { error } = await supabase
                .from('qr_codes')
                .update({
                    is_activated: false,
                    status: 'paused'
                })
                .eq('id', qr.id);

            if (error) throw error;

            // Refresh list
            const { data: newData } = await supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (newData) {
                setQrCodes(newData as QRCodeType[]);
            }
        } catch (error) {
            console.error('Error deactivating QR:', error);
            alert('Failed to deactivate QR code');
        }
    };

    const handleDownload = async (qr: QRCodeType, format: 'png' | 'svg' | 'pdf' = 'png') => {
        setDownloading(qr.id);
        try {
            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
            const scanUrl = `${appUrl}/${qr.qr_unique_id}`;

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
                link.download = `SafeDrive_QR_${(qr.vehicle_number || qr.qr_unique_id).replace(/\s+/g, '_')}.png`;
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
                link.download = `SafeDrive_QR_${(qr.vehicle_number || qr.qr_unique_id).replace(/\s+/g, '_')}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Failed to download QR:", err);
            alert("Error generating download. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    const handleBulkBatchDownload = async () => {
        const selected = qrCodes.filter(q => selectedIds.includes(q.id));
        for (const qr of selected) {
            await handleDownload(qr, 'png');
            await new Promise(r => setTimeout(r, 200));
        }
    };

    const handleBulkPrint = async () => {
        const selected = qrCodes.filter(q => selectedIds.includes(q.id));
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups for this site to print.");
            return;
        }

        const qrImages = await Promise.all(selected.map(async qr => {
            const scanUrl = `${appUrl}/${qr.qr_unique_id}`;
            return { id: qr.qr_unique_id, img: await QRCode.toDataURL(scanUrl, { width: 512, margin: 2 }) };
        }));

        printWindow.document.write(`
            <html>
                <head>
                    <title>SafeDrive Batch Print</title>
                    <style>
                        body { margin: 40px; font-family: Inter, system-ui, sans-serif; background: #fff; }
                        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                        .qr-card { border: 2px solid #f1f5f9; padding: 24px; text-align: center; border-radius: 20px; }
                        .qr-card img { width: 100%; height: auto; margin-bottom: 12px; }
                        .qr-card p { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; }
                        @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
                    </style>
                </head>
                <body>
                    <div style="margin-bottom: 40px; text-align: center;">
                        <h1 style="font-size: 24px; font-weight: 900; margin: 0;">SAFEDRIVE BATCH</h1>
                        <p style="color: #64748b; font-weight: 600;">Printing ${selected.length} Tags</p>
                    </div>
                    <div class="grid">${qrImages.map(q => `<div class="qr-card"><img src="${q.img}" /><p>#${q.id}</p></div>`).join('')}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 800);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header with Selection Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">QR Code Tags</h1>
                    <p className="text-gray-500 mt-1">
                        {selectedIds.length > 0
                            ? `${selectedIds.length} of ${filteredQRs.length} tags selected`
                            : `Manage all your vehicle safety tags and their settings.`
                        }
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                    {selectedIds.length > 0 ? (
                        <>
                            <button
                                onClick={clearSelection}
                                className="flex items-center gap-2 text-gray-600 px-4 py-2.5 rounded-2xl font-bold hover:bg-gray-100 transition"
                            >
                                <XCircle size={18} />
                                Clear
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-red-600 transition"
                            >
                                <Trash2 size={18} />
                                Delete ({selectedIds.length})
                            </button>
                            <button
                                onClick={handleBulkPrint}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={handleBulkBatchDownload}
                                className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-slate-900 transition"
                            >
                                <FileDown size={18} />
                                Export
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Bulk Generate Inline */}
                            {showBulkInput ? (
                                <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-2xl px-2">
                                    <Package size={18} className="text-slate-500 ml-2" />
                                    <input
                                        type="number"
                                        value={bulkQuantity}
                                        onChange={(e) => setBulkQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                        min="1"
                                        max="100"
                                        className="w-20 px-2 py-2.5 outline-none font-bold text-center"
                                        placeholder="Qty"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleBulkGenerate}
                                        disabled={bulkLoading}
                                        className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-900 transition disabled:opacity-50"
                                    >
                                        {bulkLoading ? <Loader2 size={16} className="animate-spin" /> : 'Generate'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowBulkInput(false);
                                            setBulkQuantity(5);
                                        }}
                                        className="text-gray-400 p-2 hover:text-gray-600"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowBulkInput(true)}
                                    className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition"
                                >
                                    <Package size={20} />
                                    Bulk Generate
                                </button>
                            )}

                            <button
                                onClick={handleSingleGenerate}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                Create New QR
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by QR code number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {/* Select All / Filter */}
                <div className="flex gap-3">
                    {filteredQRs.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                            {selectedIds.length === filteredQRs.length ? (
                                <>
                                    <CheckSquare size={18} />
                                    Deselect All
                                </>
                            ) : (
                                <>
                                    <Square size={18} />
                                    Select All
                                </>
                            )}
                        </button>
                    )}

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
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {loading ? (
                    <div className="col-span-full py-24 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Synchronizing Badges...
                    </div>
                ) : filteredQRs.length === 0 ? (
                    <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[48px] border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto text-gray-300">
                            <QrIcon size={48} />
                        </div>
                        <div>
                            <p className="text-gray-900 font-black text-xl tracking-tight">
                                {searchQuery || statusFilter !== 'all' ? 'No Results Found' : 'Fleet Empty'}
                            </p>
                            <p className="text-gray-400 font-medium mt-1">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters or search query.'
                                    : 'Deploy your first safety tag to start protecting vehicles.'}
                            </p>
                        </div>
                        {!searchQuery && statusFilter === 'all' && (
                            <button
                                onClick={handleSingleGenerate}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100"
                            >
                                <Plus size={20} />
                                Deploy Initial Tag
                            </button>
                        )}
                    </div>
                ) : filteredQRs.map((qr) => (
                    <div
                        key={qr.id}
                        onClick={() => toggleSelect(qr.id)}
                        className={`bg-white rounded-[40px] border-2 transition-all duration-500 group flex flex-col hover:-translate-y-2 relative overflow-hidden cursor-pointer ${selectedIds.includes(qr.id) ? 'border-blue-600 ring-4 ring-blue-50 shadow-2xl' : 'border-gray-100 shadow-sm shadow-slate-100'
                            }`}
                    >
                        {/* Latest/New Badge */}
                        {isLatest(qr.created_at) && (
                            <div className="absolute top-6 left-6 z-20">
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-200">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    Latest Batch
                                </div>
                            </div>
                        )}

                        {/* Active/Assigned Indicator - Top Right */}
                        {qr.is_activated && (
                            <div className="absolute top-6 right-12 z-20">
                                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    ACTIVE
                                </div>
                            </div>
                        )}

                        {/* Selection Checkbox UI */}
                        <div className="absolute top-6 right-6 z-20">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.includes(qr.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 backdrop-blur border-slate-200 text-transparent'
                                }`}>
                                <Plus size={14} className={selectedIds.includes(qr.id) ? 'rotate-45' : ''} strokeWidth={4} />
                            </div>
                        </div>

                        <div className="p-8 flex flex-col items-center">
                            {/* QR Preview Label */}
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">QR Preview</p>

                            {/* QR Preview Area */}
                            <div className="relative group/qr mb-6">
                                <div className="absolute -inset-2 bg-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover/qr:opacity-100 transition duration-500"></div>
                                <div className={`relative bg-white p-4 rounded-3xl border-2 shadow-sm transition-all duration-500 group-hover/qr:scale-105 ${qr.is_activated ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-100'
                                    }`}>
                                    {qrDataUrls[qr.id] ? (
                                        <img src={qrDataUrls[qr.id]} alt="QR Preview" className="w-32 h-32" />
                                    ) : (
                                        <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center">
                                            <QrIcon size={40} className="text-gray-200" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="text-center w-full">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-3 font-mono">
                                    #{qr.qr_unique_id}
                                </h3>

                                {/* Activation Status Card */}
                                {qr.is_activated ? (
                                    <div className="bg-gradient-to-b from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 mb-6">
                                        {qr.vehicle_number && (
                                            <div className="mb-2">
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Vehicle</p>
                                                <p className="text-lg font-black text-gray-900">{qr.vehicle_number}</p>
                                            </div>
                                        )}
                                        {qr.owner_name && (
                                            <p className="text-xs text-gray-600">
                                                <span className="text-gray-400">Owner:</span>
                                                <span className="font-bold ml-1">{qr.owner_name}</span>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                            <span className="text-xs font-bold text-amber-700">UNASSIGNED</span>
                                        </div>
                                        <p className="text-[10px] text-amber-600">Ready for activation</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2 w-full">
                                <a
                                    href={`/${qr.qr_unique_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`flex-1 h-14 ${qr.is_activated ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                        } text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95`}
                                >
                                    <ExternalLink size={16} />
                                    {qr.is_activated ? 'View' : 'Setup'}
                                </a>

                                {qr.is_activated && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeactivate(qr);
                                        }}
                                        className="h-14 px-4 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-2xl transition-all flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-rose-50 hover:shadow-rose-100 active:scale-95"
                                        title="Deactivate / Enable Editing"
                                    >
                                        <PowerOff size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(qr, 'png');
                                    }}
                                    className="flex-1 h-14 bg-slate-900 text-white rounded-2xl transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95"
                                >
                                    <Download size={18} />
                                    Export
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(qr.id);
                                    }}
                                    className="w-14 h-14 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center active:scale-95"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}