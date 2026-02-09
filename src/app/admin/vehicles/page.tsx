"use client";

import { useState, useEffect, useRef } from "react";
import {
    Car,
    Search,
    Filter,
    Plus,
    MoreVertical,
    ExternalLink,
    ChevronRight,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode } from "@/types";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<QRCode[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<QRCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionId(null);
            }
        };
        if (openActionId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openActionId]);

    useEffect(() => {
        const fetchVehicles = async () => {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setVehicles(data as QRCode[]);
                setFilteredVehicles(data as QRCode[]);
            }
            setLoading(false);
        };

        fetchVehicles();
    }, []);

    // Filter vehicles
    useEffect(() => {
        let result = vehicles;

        // Status/Type filter
        if (filterType === "active") {
            result = result.filter(v => v.status === "active");
        } else if (filterType === "paused") {
            result = result.filter(v => v.status === "paused");
        } else if (filterType !== "all") {
            result = result.filter(v => v.vehicle_type === filterType);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(v =>
                (v.vehicle_number || "").toLowerCase().includes(query) ||
                (v.owner_name || "").toLowerCase().includes(query) ||
                (v.vehicle_model || "").toLowerCase().includes(query)
            );
        }

        setFilteredVehicles(result);
    }, [filterType, searchQuery, vehicles]);


    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Vehicle Management</h1>
                    <p className="text-gray-500 mt-1">View and manage all registered vehicles across your fleet.</p>
                </div>
                <Link href="/admin/qr-codes/create" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                    <Plus size={20} />
                    Add Vehicle
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by plate, model, or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                        <Filter size={18} />
                        {filterType === "all" ? "All Vehicles" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                    {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            {["all", "active", "paused", "car", "bike", "truck"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setFilterType(type);
                                        setShowFilterDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                                >
                                    {type === "all" ? "All Vehicles" : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-6">Vehicle Details</th>
                                <th className="px-8 py-6">Owner</th>
                                <th className="px-8 py-6">Privacy</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                        Loading vehicles...
                                    </td>
                                </tr>
                            ) : vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-gray-50 p-6 rounded-[32px]">
                                                <Car className="text-gray-300 w-12 h-12" />
                                            </div>
                                            <p className="text-gray-500 font-bold">No vehicles registered yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((vh) => (
                                    <tr key={vh.id} className="hover:bg-gray-50/50 transition group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                                    <Car size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 leading-tight">{vh.vehicle_number || "PENDING"}</p>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{vh.vehicle_make || "Unassigned"} {vh.vehicle_model || "Tag"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-800 text-sm">{vh.owner_name || "New Customer"}</p>
                                            <p className="text-xs text-gray-400 font-medium">{vh.owner_mobile || "Not Activated"}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                {vh.call_enabled && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Calls Enabled"></div>}
                                                {vh.whatsapp_enabled && <div className="w-2 h-2 bg-emerald-500 rounded-full" title="WhatsApp Enabled"></div>}
                                                {vh.emergency_enabled && <div className="w-2 h-2 bg-red-500 rounded-full" title="Emergency Enabled"></div>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${vh.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {vh.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 relative">
                                            <button
                                                onClick={() => setOpenActionId(openActionId === vh.id ? null : vh.id)}
                                                className="p-2 text-gray-300 hover:text-gray-900 transition"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openActionId === vh.id && (
                                                <div ref={actionMenuRef} className="absolute right-8 top-16 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                    <div className="p-2">
                                                        <Link href={`/admin/qr-codes/${vh.qr_unique_id}`} className="block w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition">
                                                            Edit Settings
                                                        </Link>
                                                        <Link href={`/${vh.qr_unique_id}`} target="_blank" className="block w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition">
                                                            View Test Scan
                                                        </Link>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Delete this vehicle?")) {
                                                                    const { error } = await supabase.from('qr_codes').delete().eq('id', vh.id);
                                                                    if (!error) setVehicles(prev => prev.filter(v => v.id !== vh.id));
                                                                }
                                                                setOpenActionId(null);
                                                            }}
                                                            className="block w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            Delete Vehicle
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                        Loading fleet...
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center">
                        <Car className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-bold italic">No vehicles found.</p>
                    </div>
                ) : (
                    filteredVehicles.map((vh) => (
                        <div key={vh.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 leading-tight">{vh.vehicle_number || "PENDING"}</h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{vh.vehicle_make || "Unassigned"} {vh.vehicle_model || "Tag"}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${vh.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {vh.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Owner</p>
                                    <p className="text-sm font-bold text-gray-800">{vh.owner_name || "New Customer"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Privacy</p>
                                    <div className="flex gap-2 items-center h-5">
                                        {vh.call_enabled && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        {vh.whatsapp_enabled && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                                        {vh.emergency_enabled && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                                        <span className="text-[10px] font-bold text-gray-400 ml-1">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Fleet Stats Summary */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-blue-600 rounded-[40px] p-10 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4">Protect Your Fleet</h3>
                        <p className="opacity-80 leading-relaxed mb-8 max-w-sm">
                            Each vehicle receives a unique encrypted identifier. You can pause or delete tags anytime to stop receiving contacts.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold bg-white/10 w-fit px-4 py-2 rounded-full border border-white/20">
                            <ShieldCheck size={16} /> Data Encryption Active
                        </div>
                    </div>
                    <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Need assistance?</h3>
                        <p className="text-gray-500">Contact our fleet support team for bulk registration and specialized safety tags.</p>
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
                        >
                            Contact Support <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Support Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
                    <div className="bg-white rounded-[40px] p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Assistance?</h2>
                        <p className="text-gray-600 mb-6">Contact our support team for help with your vehicles.</p>
                        <div className="space-y-4">
                            <a href="mailto:support@safedrive.com" className="block p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
                                <p className="font-bold text-blue-600">📧 Email Support</p>
                                <p className="text-sm text-gray-600">support@safedrive.com</p>
                            </a>
                            <a href="tel:+1234567890" className="block p-4 bg-green-50 rounded-xl hover:bg-green-100 transition">
                                <p className="font-bold text-green-600">📞 Phone Support</p>
                                <p className="text-sm text-gray-600">+1 (234) 567-890</p>
                            </a>
                            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="block p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition">
                                <p className="font-bold text-emerald-600">💬 WhatsApp Support</p>
                                <p className="text-sm text-gray-600">Chat with us instantly</p>
                            </a>
                        </div>
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="w-full mt-6 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
