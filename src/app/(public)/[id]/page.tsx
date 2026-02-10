"use client";

import { useState, useEffect, use } from "react";
import {
    Car,
    Phone,
    MessageSquare,
    AlertTriangle,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    Info,
    Loader2,
    AlertCircle,
    Send,
    CheckCircle2,
    Users,
    Briefcase,
    Heart,
    Building2,
    UserCircle,
    Truck,
    User,
    MapPin,
    Palette,
    Shield,
    Sparkles,
    Check,
    Home,
    Building,
    Navigation,
    Droplets,
    Stethoscope,
    AlertOctagon,
    ParkingCircle,
    Layers,
    Hash,
    Map,
    LucideIcon,
    Upload,
    FileText,
    PhoneCall,
    Siren
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode as QRCodeType } from "@/types";
import QRCode from "qrcode";

// ✅ FIXED: Vehicle Type Icons Mapping
const getVehicleIcon = (type: string, size: number = 32) => {
    const iconMap = {
        car: <span className="text-white text-2xl">🚗</span>,
        bike: <span className="text-white text-2xl">🏍️</span>,
        scooty: <span className="text-white text-2xl">🛵</span>,
        truck: <span className="text-white text-2xl">🚚</span>,
        auto: <span className="text-white text-2xl">🛺</span>,
        bus: <span className="text-white text-2xl">🚌</span>,
        other: <span className="text-white text-2xl">🚗</span>
    };
    return iconMap[type as keyof typeof iconMap] || iconMap.car;
};

// ✅ FIX: Components ko BAHAR define karo
interface InputFieldProps {
    icon?: LucideIcon;
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    prefix?: string;
    maxLength?: number;
}

const InputField = ({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    required = false,
    type = "text",
    prefix,
    maxLength
}: InputFieldProps) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            {Icon && <Icon size={16} className="text-gray-400" />}
            {label}
            {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
            {prefix && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{prefix}</span>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-4 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400 ${prefix ? 'pl-12' : ''}`}
            />
        </div>
    </div>
);

interface SelectFieldProps {
    icon?: LucideIcon;
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
}

const SelectField = ({
    icon: Icon,
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false
}: SelectFieldProps) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            {Icon && <Icon size={16} className="text-gray-400" />}
            {label}
            {required && <span className="text-red-400">*</span>}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-4 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-gray-900 appearance-none cursor-pointer"
        >
            <option value="">{placeholder || 'Select...'}</option>
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

// Blood group options
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Indian states
const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

// Steps config
const steps = [
    { id: 1, title: 'Owner', icon: <User size={16} />, color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Emergency', icon: <Heart size={16} />, color: 'from-rose-500 to-pink-600' },
    { id: 3, title: 'Vehicle', icon: <Car size={16} />, color: 'from-blue-500 to-cyan-600' },
    { id: 4, title: 'Address', icon: <MapPin size={16} />, color: 'from-emerald-500 to-teal-600' }
];

// ✅ Main Component starts here
export default function ScanPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const [qrCode, setQrCode] = useState<QRCodeType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relayMessage, setRelayMessage] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

    // Insurance upload states
    const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
    const [insuranceUploading, setInsuranceUploading] = useState(false);
    const [hasPreFilled, setHasPreFilled] = useState(false);

    const [regStep, setRegStep] = useState(1);

    // ✅ FIXED: Vehicle Type Definition - Added all types including bus
    const [regData, setRegData] = useState({
        owner_name: "",
        owner_mobile: "",
        owner_whatsapp: "",
        vehicle_number: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_color: "",
        vehicle_type: "car" as "car" | "bike" | "scooty" | "truck" | "auto" | "bus",
        emergency_contacts: {
            family: { name: "", mobile: "", whatsapp: "" },
            friend: { name: "", mobile: "", whatsapp: "" },
            office: { name: "", mobile: "", whatsapp: "" }
        },
        details_type: 'normal' as 'normal' | 'society',
        details_data: {
            society_name: "",
            flat_number: "",
            wing: "",
            block_tower: "",
            floor: "",
            parking_slot: "",
            house_number: "",
            building_name: "",
            street_road: "",
            landmark: "",
            area_locality: "",
            city: "",
            state: "",
            pincode: "",
            blood_group: "",
            medical_conditions: "",
            allergies: "",
            emergency_notes: ""
        },
        insurance_pdf_url: ""
    });
    const [regLoading, setRegLoading] = useState(false);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
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

    // ✅ Update functions - ye sahi tarike se kaam karenge
    const updateOwnerData = (field: string, value: string) => {
        setRegData(prev => ({ ...prev, [field]: value }));
    };

    const updateDetailsData = (field: string, value: string) => {
        setRegData(prev => ({
            ...prev,
            details_data: { ...prev.details_data, [field]: value }
        }));
    };

    const updateEmergencyContact = (contactType: string, field: string, value: string) => {
        setRegData(prev => ({
            ...prev,
            emergency_contacts: {
                ...prev.emergency_contacts,
                [contactType]: {
                    ...(prev.emergency_contacts as any)[contactType],
                    [field]: value
                }
            }
        }));
    };

    // ✅ FIXED: Insurance upload function - Better error handling and state management
    const uploadInsurance = async (file: File) => {
        setInsuranceUploading(true);
        try {
            console.log('📄 Starting insurance upload:', { file: file.name, qr_id: qrCode?.id });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('qr_id', qrCode?.id || '');

            const response = await fetch('/api/upload/insurance', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('📄 Upload response:', data);

            if (data.success && data.url) {
                // ✅ Update BOTH states AND refresh QR data
                setRegData(prev => ({ ...prev, insurance_pdf_url: data.url }));
                setQrCode(prev => prev ? ({ ...prev, insurance_pdf_url: data.url } as any) : null);

                showModal({
                    type: 'alert',
                    title: 'Insurance Uploaded! ✅',
                    message: 'Insurance document has been saved successfully and will be available in details.',
                    priority: 'success'
                });

                console.log('✅ Insurance URL saved:', data.url);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error: any) {
            console.error('❌ Insurance upload failed:', error);
            showModal({
                type: 'alert',
                title: 'Upload Failed',
                message: `Failed to upload insurance: ${error.message}`,
                priority: 'high'
            });
        } finally {
            setInsuranceUploading(false);
        }
    };

    const maskPhone = (phone: string | null | undefined) => {
        if (!phone) return "No Mobile";
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) return "*******" + cleaned.slice(-3);
        return "+91 " + cleaned.slice(0, 2) + "****" + cleaned.slice(-4);
    };

    const maskName = (name: string | null | undefined) => {
        if (!name) return "Anonymous Owner";
        if (qrCode?.show_owner_name) return name;
        return name[0] + "****" + name.slice(-1);
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
                if (!data) throw new Error("Tag data missing");

                console.log('🔍 Fetched QR data:', {
                    id: data.id,
                    vehicle_type: data.vehicle_type,
                    insurance_url: data.insurance_pdf_url
                });

                setQrCode(data as QRCodeType);

                const scanUrl = `${window.location.origin}/${data.qr_unique_id}`;
                const dataUrl = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 });
                setQrImageUrl(dataUrl);

                // ✅ Log this scan visit to scan_logs table
                try {
                    console.log('🔍 Logging Scan -> UniqueID:', data.qr_unique_id, 'UUID:', data.id);
                    await fetch('/api/scan/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            qr_code_id: data.id,
                            scan_type: 'normal',
                            scanner_ip: null,
                            location: null
                        })
                    });
                } catch (e) {
                    // Scan log failure should not block page
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchQRData();
    }, [params.id]);

    // ✅ FIXED: Pre-fill data - ONLY ONCE on initial load to avoid wiping what the user types!
    useEffect(() => {
        if (qrCode && !hasPreFilled) {
            console.log('🔄 Initial Pre-filling data from database');

            setRegData(prev => ({
                ...prev,
                owner_name: qrCode.owner_name || "",
                owner_mobile: qrCode.owner_mobile || "",
                owner_whatsapp: qrCode.owner_whatsapp || "",
                vehicle_number: qrCode.vehicle_number || "",
                vehicle_make: qrCode.vehicle_make || "",
                vehicle_model: qrCode.vehicle_model || "",
                vehicle_color: qrCode.vehicle_color || "",
                vehicle_type: (qrCode.vehicle_type as any) || "car",
                emergency_contacts: {
                    family: {
                        name: qrCode.emergency_contacts?.family?.name || "",
                        mobile: qrCode.emergency_contacts?.family?.mobile || "",
                        whatsapp: qrCode.emergency_contacts?.family?.whatsapp || ""
                    },
                    friend: {
                        name: qrCode.emergency_contacts?.friend?.name || "",
                        mobile: qrCode.emergency_contacts?.friend?.mobile || "",
                        whatsapp: qrCode.emergency_contacts?.friend?.whatsapp || ""
                    },
                    office: {
                        name: qrCode.emergency_contacts?.office?.name || "",
                        mobile: qrCode.emergency_contacts?.office?.mobile || "",
                        whatsapp: qrCode.emergency_contacts?.office?.whatsapp || ""
                    }
                },
                details_type: (qrCode.details_type as any) || 'normal',
                details_data: {
                    society_name: qrCode.details_data?.society_name || "",
                    flat_number: qrCode.details_data?.flat_number || "",
                    wing: qrCode.details_data?.wing || "",
                    block_tower: qrCode.details_data?.block_tower || "",
                    floor: qrCode.details_data?.floor || "",
                    parking_slot: qrCode.details_data?.parking_slot || "",
                    house_number: qrCode.details_data?.house_number || "",
                    building_name: qrCode.details_data?.building_name || "",
                    street_road: qrCode.details_data?.street_road || "",
                    landmark: qrCode.details_data?.landmark || "",
                    area_locality: qrCode.details_data?.area_locality || "",
                    city: qrCode.details_data?.city || "",
                    state: qrCode.details_data?.state || "",
                    pincode: qrCode.details_data?.pincode || "",
                    blood_group: qrCode.details_data?.blood_group || "",
                    medical_conditions: qrCode.details_data?.medical_conditions || "",
                    allergies: qrCode.details_data?.allergies || "",
                    emergency_notes: qrCode.details_data?.emergency_notes || ""
                },
                insurance_pdf_url: qrCode.insurance_pdf_url || (qrCode as any).insurance_pdf_url || ""
            }));
            setHasPreFilled(true);
        }
    }, [qrCode, hasPreFilled]);

    const validateStep = (): boolean => {
        if (regStep === 1) {
            if (!regData.owner_name?.trim()) {
                showModal({ type: 'alert', title: 'Name Required', message: 'Please enter your full name.', priority: 'normal' });
                return false;
            }
            const cleanMobile = regData.owner_mobile?.replace(/\D/g, '') || '';
            if (cleanMobile.length < 10) {
                showModal({ type: 'alert', title: 'Invalid Mobile', message: 'Please enter a valid 10-digit mobile number.', priority: 'normal' });
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setRegStep(prev => Math.min(prev + 1, 4));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setRegStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleActivate = async () => {
        if (!regData.owner_name?.trim() || !regData.owner_mobile?.trim()) {
            showModal({ type: 'alert', title: 'Required Info', message: "Owner name and mobile are required.", priority: 'normal' });
            return;
        }

        if (!qrCode?.id) {
            showModal({ type: 'alert', title: 'Error', message: "QR Code not found. Please refresh.", priority: 'high' });
            return;
        }

        setRegLoading(true);

        try {
            console.log('🔄 Activating with data:', {
                qr_id: qrCode.id,
                vehicle_type: regData.vehicle_type,
                insurance_pdf_url: regData.insurance_pdf_url
            });

            const response = await fetch('/api/qr/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qr_id: qrCode.id, ...regData })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Activation successful:', data.qr_code);
                setQrCode(data.qr_code);
                setIsUpdating(false);
                showModal({ type: 'alert', title: 'Activated! 🎉', message: "Your SafeDrive tag is now live.", priority: 'success' });
            } else {
                throw new Error(data.error || 'Activation failed');
            }
        } catch (err: any) {
            console.error('❌ Activation failed:', err);
            showModal({ type: 'alert', title: 'Error', message: err.message, priority: 'high' });
        } finally {
            setRegLoading(false);
        }
    };

    const handleEmergency = () => {
        const contacts = qrCode?.emergency_contacts as any;
        const hasContacts = contacts?.family?.mobile || contacts?.friend?.mobile || contacts?.office?.mobile;

        if (!hasContacts) {
            showModal({
                type: 'alert',
                title: 'No Emergency Contacts',
                message: 'The owner has not added emergency contacts yet.',
                priority: 'normal'
            });
            return;
        }

        // We'll use a custom modal type for emergency contacts
        setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'Emergency Contacts',
            message: '', // Will be rendered differently
            priority: 'high'
        });
    };

    // Loading
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                </div>
                <p className="font-semibold text-gray-500">Loading...</p>
            </div>
        </div>
    );

    // Error
    if (error || !qrCode) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="bg-white rounded-[32px] p-10 shadow-xl max-w-sm text-center">
                <div className="w-20 h-20 bg-red-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black mb-2">Not Found</h2>
                <p className="text-gray-500 mb-6">{error || "Tag doesn't exist"}</p>
                <Link href="/" className="text-blue-600 font-bold">← Go Home</Link>
            </div>
        </div>
    );

    // Modal Component
    const renderModal = () => {
        if (!modalConfig.isOpen) return null;

        // Special rendering for Emergency Contacts
        if (modalConfig.title === 'Emergency Contacts') {
            const contacts = qrCode?.emergency_contacts as any;
            const contactList = [
                { type: 'family', label: 'Family Member', data: contacts?.family, icon: Heart, color: 'rose' },
                { type: 'friend', label: 'Trusted Friend', data: contacts?.friend, icon: Users, color: 'blue' },
                { type: 'office', label: 'Office / Work', data: contacts?.office, icon: Briefcase, color: 'amber' }
            ].filter(c => c.data?.mobile);

            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-lg bg-gradient-to-br from-red-500 to-rose-600">
                                <AlertTriangle size={36} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-1">🆘 Emergency Contacts</h2>
                            <p className="text-sm text-gray-500">Tap to call or message</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {contactList.map((contact) => (
                                <div key={contact.type} className="bg-gray-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <contact.icon size={16} className={`text-${contact.color}-600`} />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{contact.label}</span>
                                    </div>
                                    <p className="font-bold text-gray-900 mb-3">{contact.data.name || 'Contact'}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                window.location.href = `tel:${contact.data.mobile}`;
                                                closeModal();
                                            }}
                                            className="bg-blue-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <Phone size={16} />
                                            Call
                                        </button>
                                        <button
                                            onClick={() => {
                                                const mobile = contact.data.whatsapp || contact.data.mobile;
                                                window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(`🆘 EMERGENCY regarding ${qrCode?.vehicle_number || qrCode?.owner_name}`)}`, '_blank');
                                                closeModal();
                                            }}
                                            className="bg-emerald-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <MessageSquare size={16} />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={closeModal}
                            className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }

        // ✅ FIXED: Professional Details Modal with Insurance Support
        if (modalConfig.title === 'Owner Details' && modalConfig.message === 'details_view') {
            const details = qrCode?.details_data as any;

            // ✅ Better Insurance URL Detection
            const insuranceUrl = qrCode?.insurance_pdf_url ||
                (qrCode as any)?.insurance_pdf_url ||
                regData.insurance_pdf_url;

            console.log('🔍 Modal Debug - Insurance URL:', insuranceUrl);
            console.log('🔍 Modal Debug - QR Code:', qrCode);

            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Info size={36} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-1">Owner Details</h2>
                            <p className="text-sm text-gray-500">Complete Information</p>
                        </div>

                        <div className="space-y-4">
                            {/* Owner Info */}
                            {(qrCode?.owner_name || qrCode?.owner_mobile) && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCircle size={16} className="text-blue-600" />
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Owner Information</span>
                                    </div>
                                    {qrCode?.owner_name && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Name</span>
                                            <span className="font-semibold text-gray-900">{qrCode.owner_name}</span>
                                        </div>
                                    )}
                                    {qrCode?.owner_mobile && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Mobile</span>
                                            <span className="font-semibold text-gray-900">+91 {qrCode.owner_mobile}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ✅ FIXED: Insurance Info Section - Priority Position */}
                            {insuranceUrl && (
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Shield size={64} className="text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                        <Shield size={18} className="text-emerald-600" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">🛡️ VEHICLE INSURANCE</span>
                                    </div>
                                    <div className="flex flex-col gap-3 relative z-10">
                                        {/* <p className="text-xs text-emerald-800 font-semibold">✅ Digital insurance copy is available for this vehicle.</p> */}
                                        <button
                                            onClick={() => {
                                                console.log('🔗 Opening insurance PDF:', insuranceUrl);
                                                window.open(insuranceUrl, '_blank');
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                                        >
                                            <FileText size={20} />
                                            📄 OPEN INSURANCE PDF
                                        </button>
                                        {/* <p className="text-[10px] text-emerald-600 text-center font-medium">Click above to download and view insurance document</p> */}
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Info */}
                            {(qrCode?.vehicle_number || qrCode?.vehicle_make || qrCode?.vehicle_model) && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Car size={16} className="text-purple-600" />
                                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Vehicle Information</span>
                                    </div>
                                    {qrCode?.vehicle_number && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Number</span>
                                            <span className="font-bold text-gray-900 bg-yellow-100 px-2 py-1 rounded-lg">{qrCode.vehicle_number}</span>
                                        </div>
                                    )}
                                    {(qrCode?.vehicle_make || qrCode?.vehicle_model) && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Vehicle</span>
                                            <span className="font-semibold text-gray-900">{[qrCode?.vehicle_make, qrCode?.vehicle_model].filter(Boolean).join(' ')}</span>
                                        </div>
                                    )}
                                    {qrCode?.vehicle_color && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Color</span>
                                            <span className="font-semibold text-gray-900">{qrCode.vehicle_color}</span>
                                        </div>
                                    )}
                                    {qrCode?.vehicle_type && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Type</span>
                                            <span className="font-semibold text-gray-900 capitalize">{qrCode.vehicle_type}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Address Info */}
                            {details && typeof details === 'object' && Object.values(details).some(v => v) && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin size={16} className="text-amber-600" />
                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Address</span>
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed">
                                        {qrCode?.details_type === 'society' ? (
                                            <>
                                                {details?.society_name && <div className="font-semibold">{details.society_name}</div>}
                                                {details?.flat_number && <div>Flat {details.flat_number}{details?.wing ? `, Wing ${details.wing}` : ''}</div>}
                                                {details?.block_tower && <div>{details.block_tower}</div>}
                                                {details?.parking_slot && <div className="text-xs text-amber-700 mt-1">🅿️ Parking: {details.parking_slot}</div>}
                                            </>
                                        ) : (
                                            <>
                                                {details?.house_number && <div>House {details.house_number}</div>}
                                                {details?.street_road && <div>{details.street_road}</div>}
                                                {details?.landmark && <div className="text-xs text-amber-700">📍 {details.landmark}</div>}
                                            </>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-amber-200">
                                            {[details?.area_locality, details?.city, details?.state, details?.pincode].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Medical Info */}
                            {(details?.blood_group || details?.medical_conditions || details?.allergies) && (
                                <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Stethoscope size={16} className="text-rose-600" />
                                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Medical Info</span>
                                    </div>
                                    {details?.blood_group && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-600">Blood Group</span>
                                            <span className="font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">{details.blood_group}</span>
                                        </div>
                                    )}
                                    {details?.allergies && (
                                        <div className="py-1">
                                            <span className="text-sm text-gray-600 block">Allergies</span>
                                            <span className="text-sm text-gray-900">{details.allergies}</span>
                                        </div>
                                    )}
                                    {details?.medical_conditions && (
                                        <div className="py-1">
                                            <span className="text-sm text-gray-600 block">Conditions</span>
                                            <span className="text-sm text-gray-900">{details.medical_conditions}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={closeModal}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 font-bold rounded-2xl hover:from-gray-200 hover:to-gray-300 transition-all"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            );
        }

        // Default modal rendering
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
                    <div className="text-center mb-6">
                        <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-lg ${modalConfig.priority === 'high' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                            modalConfig.priority === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}>
                            {modalConfig.priority === 'high' ? <AlertTriangle size={36} className="text-white" /> :
                                modalConfig.priority === 'success' ? <CheckCircle2 size={36} className="text-white" /> :
                                    <Info size={36} className="text-white" />}
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">{modalConfig.title}</h2>
                        <p className="text-gray-500 leading-relaxed whitespace-pre-line">{modalConfig.message}</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                if (modalConfig.onConfirm) modalConfig.onConfirm();
                                closeModal();
                            }}
                            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${modalConfig.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' :
                                modalConfig.priority === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' :
                                    'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
                                }`}
                        >
                            {modalConfig.type === 'confirm' ? 'Yes, Proceed' : 'Got it'}
                        </button>

                        {modalConfig.type === 'confirm' && (
                            <button onClick={closeModal} className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ========== REGISTRATION FORM ==========
    if (!qrCode.is_activated || isUpdating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 leading-none">SafeDrive</h1>
                                <p className="text-[10px] text-gray-400 font-medium">Vehicle Protection</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-lg mx-auto px-5 py-8 pb-44 relative z-10">
                    {/* Progress Steps */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full mx-10" />
                            <div
                                className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-10 transition-all duration-500"
                                style={{ width: `${((regStep - 1) / 3) * 80}%` }}
                            />

                            {steps.map((step) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <button
                                        onClick={() => step.id < regStep && setRegStep(step.id)}
                                        disabled={step.id > regStep}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${regStep >= step.id
                                            ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                                            : 'bg-gray-100 text-gray-400'
                                            } ${step.id < regStep ? 'cursor-pointer hover:scale-110' : ''}`}
                                    >
                                        {regStep > step.id ? <Check size={16} /> : step.icon}
                                    </button>
                                    <span className={`text-[10px] font-bold mt-2 ${regStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QR Preview */}
                    {!isUpdating && regStep === 1 && (
                        <div className="mb-10">
                            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[32px] p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                                <div className="relative flex items-center gap-5">
                                    <div className="bg-white rounded-2xl p-3 shadow-2xl">
                                        {qrImageUrl ? (
                                            <img src={qrImageUrl} alt="QR" className="w-24 h-24" />
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-100 rounded-xl animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={14} className="text-yellow-400" />
                                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Ready to Activate</span>
                                        </div>
                                        <h2 className="text-2xl font-black mb-1">Tag #{qrCode.qr_unique_id}</h2>
                                        <p className="text-sm text-gray-400">Complete setup to activate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Owner Profile */}
                    {regStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                                    <User size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Owner Profile</h2>
                                    <p className="text-sm text-gray-500">Your contact details</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
                                <InputField
                                    icon={UserCircle}
                                    label="Full Name"
                                    value={regData.owner_name}
                                    onChange={(val) => updateOwnerData('owner_name', val)}
                                    placeholder="Enter your full name"
                                    required
                                />

                                <InputField
                                    icon={Phone}
                                    label="Mobile Number"
                                    value={regData.owner_mobile}
                                    onChange={(val) => updateOwnerData('owner_mobile', val)}
                                    placeholder="9876543210"
                                    prefix="+91"
                                    maxLength={10}
                                    required
                                    type="tel"
                                />

                                <div className="space-y-2">
                                    <InputField
                                        icon={MessageSquare}
                                        label="WhatsApp Number"
                                        value={regData.owner_whatsapp}
                                        onChange={(val) => updateOwnerData('owner_whatsapp', val)}
                                        placeholder="Same as mobile"
                                        prefix="+91"
                                        maxLength={10}
                                        type="tel"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateOwnerData('owner_whatsapp', regData.owner_mobile)}
                                        className="text-xs text-violet-600 font-semibold hover:underline ml-1"
                                    >
                                        ↳ Use same as mobile
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Emergency Contacts */}
                    {regStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                                    <Heart size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Emergency Contacts</h2>
                                    <p className="text-sm text-gray-500">Who to contact in emergencies</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'family', label: 'Family Member', icon: Heart, bg: 'bg-rose-50', iconColor: 'text-rose-500' },
                                    { id: 'friend', label: 'Trusted Friend', icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
                                    { id: 'office', label: 'Office / Work', icon: Briefcase, bg: 'bg-amber-50', iconColor: 'text-amber-500' }
                                ].map((contact) => (
                                    <div key={contact.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${contact.bg} rounded-xl flex items-center justify-center ${contact.iconColor}`}>
                                                <contact.icon size={18} />
                                            </div>
                                            <span className="font-bold text-gray-900">{contact.label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                placeholder="Contact Name"
                                                value={(regData.emergency_contacts as any)?.[contact.id]?.name || ''}
                                                onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                                                className="bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none focus:border-gray-300 font-medium"
                                            />
                                            <input
                                                placeholder="Mobile Number"
                                                value={(regData.emergency_contacts as any)?.[contact.id]?.mobile || ''}
                                                onChange={(e) => updateEmergencyContact(contact.id, 'mobile', e.target.value)}
                                                className="bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none focus:border-gray-300 font-medium"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    <strong>Tip:</strong> Add at least one emergency contact.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Vehicle Details */}
                    {regStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Car size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Vehicle Identity</h2>
                                    <p className="text-sm text-gray-500">Your vehicle details</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-6">
                                {/* Vehicle Number */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Shield size={16} className="text-gray-400" />
                                        License Plate Number
                                    </label>
                                    <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-400 rounded-2xl p-1 shadow-lg">
                                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                                            <input
                                                type="text"
                                                value={regData.vehicle_number}
                                                onChange={(e) => updateOwnerData('vehicle_number', e.target.value.toUpperCase())}
                                                placeholder="MH 12 AB 1234"
                                                className="w-full bg-transparent py-5 px-6 outline-none font-black text-2xl text-center text-gray-900 placeholder:text-gray-400 uppercase tracking-wider"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Make & Model */}
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Make / Brand"
                                        value={regData.vehicle_make}
                                        onChange={(val) => updateOwnerData('vehicle_make', val)}
                                        placeholder="Toyota"
                                    />
                                    <InputField
                                        label="Model"
                                        value={regData.vehicle_model}
                                        onChange={(val) => updateOwnerData('vehicle_model', val)}
                                        placeholder="Fortuner"
                                    />
                                </div>

                                {/* ✅ FIXED: Vehicle Type with all options including bus */}
                                <div className="space-y-2 ">
                                    <label className="text-sm font-semibold text-gray-700">Vehicle Type</label>
                                    <div className="grid grid-cols-3 gap-4 mt-2">
                                        {[
                                            { id: 'car', icon: <span className="text-xl">🚗</span>, label: 'Car' },
                                            { id: 'bike', icon: <span className="text-xl">🏍️</span>, label: 'Bike' },
                                            { id: 'scooty', icon: <span className="text-xl">🛵</span>, label: 'Scooty' },
                                            { id: 'truck', icon: <span className="text-xl">🚚</span>, label: 'Truck' },
                                            { id: 'bus', icon: <span className="text-xl">🚌</span>, label: 'Bus' },
                                            { id: 'auto', icon: <span className="text-xl">🛺</span>, label: 'Auto' }
                                        ].map(v => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => {
                                                    console.log('🚗 Vehicle type selected:', v.id);
                                                    setRegData(prev => ({
                                                        ...prev,
                                                        vehicle_type: v.id as "car" | "bike" | "scooty" | "truck" | "auto" | "bus"
                                                    }));
                                                }}
                                                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${regData.vehicle_type === v.id
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                            >
                                                {v.icon}
                                                <span className="text-[9px] font-bold">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Selected: <span className="font-semibold capitalize text-blue-600">{regData.vehicle_type}</span></p>
                                </div>

                                {/* Color */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Palette size={16} className="text-gray-400" />
                                        Vehicle Color
                                    </label>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {[
                                            { name: 'White', color: '#FFFFFF', border: true },
                                            { name: 'Black', color: '#1a1a1a' },
                                            { name: 'Silver', color: '#C0C0C0' },
                                            { name: 'Red', color: '#EF4444' },
                                            { name: 'Blue', color: '#3B82F6' },
                                            { name: 'Grey', color: '#6B7280' }
                                        ].map(c => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => updateOwnerData('vehicle_color', c.name)}
                                                className={`w-10 h-10 rounded-xl transition-all ${regData.vehicle_color === c.name ? 'ring-4 ring-blue-500 ring-offset-2 scale-110' : ''} ${c.border ? 'border-2 border-gray-200' : ''}`}
                                                style={{ backgroundColor: c.color }}
                                                title={c.name}
                                            />
                                        ))}
                                        <input
                                            value={regData.vehicle_color}
                                            onChange={(e) => updateOwnerData('vehicle_color', e.target.value)}
                                            placeholder="Other color"
                                            className="flex-1 min-w-[100px] bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-sm outline-none focus:border-blue-500 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ✅ Insurance Upload Section */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-[28px] p-6 space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Shield size={18} />
                                    <span className="font-bold text-sm">Vehicle Insurance</span>
                                    <span className="text-xs text-gray-500 font-normal ml-auto">Optional</span>
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setInsuranceFile(file);
                                                uploadInsurance(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={insuranceUploading}
                                    />
                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${insuranceFile || regData.insurance_pdf_url
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : insuranceUploading
                                            ? 'border-emerald-300 bg-emerald-25'
                                            : 'border-gray-300 hover:border-emerald-400'
                                        }`}>
                                        {insuranceUploading ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900 text-sm">Uploading...</p>
                                                    <p className="text-xs text-gray-500">Please wait</p>
                                                </div>
                                            </div>
                                        ) : (insuranceFile || regData.insurance_pdf_url) ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                                    <CheckCircle2 size={20} className="text-emerald-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        ✅ {insuranceFile ? insuranceFile.name : 'Insurance Uploaded'}
                                                    </p>
                                                    <p className="text-xs text-emerald-600">
                                                        {insuranceFile ? `${(insuranceFile.size / 1024 / 1024).toFixed(1)} MB` : 'Available in details'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                    <Upload size={24} className="text-emerald-600" />
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm">📄 Upload Insurance Copy</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Address & Safety Info */}
                    {regStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <MapPin size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Address & Safety</h2>
                                    <p className="text-sm text-gray-500">Your residence details</p>
                                </div>
                            </div>

                            {/* Address Type Toggle */}
                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRegData(prev => ({ ...prev, details_type: 'normal' }))}
                                        className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${regData.details_type === 'normal'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Home size={18} />
                                        Individual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegData(prev => ({ ...prev, details_type: 'society' }))}
                                        className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${regData.details_type === 'society'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Building2 size={18} />
                                        Society
                                    </button>
                                </div>
                            </div>

                            {/* Society Address */}
                            {regData.details_type === 'society' && (
                                <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                        <Building2 size={18} />
                                        <span className="font-bold text-sm">Society / Apartment Details</span>
                                    </div>

                                    <InputField
                                        icon={Building}
                                        label="Society / Apartment Name"
                                        value={regData.details_data.society_name}
                                        onChange={(val) => updateDetailsData('society_name', val)}
                                        placeholder="e.g., Sunshine Heights"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField
                                            icon={Hash}
                                            label="Flat / House No"
                                            value={regData.details_data.flat_number}
                                            onChange={(val) => updateDetailsData('flat_number', val)}
                                            placeholder="e.g., 404"
                                        />
                                        <InputField
                                            label="Wing"
                                            value={regData.details_data.wing}
                                            onChange={(val) => updateDetailsData('wing', val)}
                                            placeholder="e.g., A, B"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField
                                            icon={Building2}
                                            label="Block / Tower"
                                            value={regData.details_data.block_tower}
                                            onChange={(val) => updateDetailsData('block_tower', val)}
                                            placeholder="e.g., Tower 1"
                                        />
                                        <InputField
                                            icon={Layers}
                                            label="Floor (Optional)"
                                            value={regData.details_data.floor}
                                            onChange={(val) => updateDetailsData('floor', val)}
                                            placeholder="e.g., 4th"
                                        />
                                    </div>

                                    <InputField
                                        icon={ParkingCircle}
                                        label="Parking Slot No"
                                        value={regData.details_data.parking_slot}
                                        onChange={(val) => updateDetailsData('parking_slot', val)}
                                        placeholder="e.g., B-45"
                                    />
                                </div>
                            )}

                            {/* Individual Address */}
                            {regData.details_type === 'normal' && (
                                <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                        <Home size={18} />
                                        <span className="font-bold text-sm">Home Address</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField
                                            icon={Hash}
                                            label="House / Plot No"
                                            value={regData.details_data.house_number}
                                            onChange={(val) => updateDetailsData('house_number', val)}
                                            placeholder="e.g., 42"
                                        />
                                        <InputField
                                            label="Building Name"
                                            value={regData.details_data.building_name}
                                            onChange={(val) => updateDetailsData('building_name', val)}
                                            placeholder="(if any)"
                                        />
                                    </div>

                                    <InputField
                                        icon={Navigation}
                                        label="Street / Road"
                                        value={regData.details_data.street_road}
                                        onChange={(val) => updateDetailsData('street_road', val)}
                                        placeholder="e.g., MG Road"
                                    />

                                    <InputField
                                        icon={MapPin}
                                        label="Landmark"
                                        value={regData.details_data.landmark}
                                        onChange={(val) => updateDetailsData('landmark', val)}
                                        placeholder="e.g., Near City Mall"
                                    />
                                </div>
                            )}

                            {/* Common Location Fields */}
                            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                    <Map size={18} />
                                    <span className="font-bold text-sm">Location Details</span>
                                </div>

                                <InputField
                                    icon={MapPin}
                                    label="Area / Locality"
                                    value={regData.details_data.area_locality}
                                    onChange={(val) => updateDetailsData('area_locality', val)}
                                    placeholder="e.g., Andheri West"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="City"
                                        value={regData.details_data.city}
                                        onChange={(val) => updateDetailsData('city', val)}
                                        placeholder="e.g., Mumbai"
                                    />
                                    <SelectField
                                        label="State"
                                        value={regData.details_data.state}
                                        onChange={(val) => updateDetailsData('state', val)}
                                        options={indianStates}
                                        placeholder="Select State"
                                    />
                                </div>

                                <InputField
                                    label="Pincode"
                                    value={regData.details_data.pincode}
                                    onChange={(val) => updateDetailsData('pincode', val)}
                                    placeholder="e.g., 400058"
                                    maxLength={6}
                                    type="tel"
                                />
                            </div>

                            {/* Medical & Safety Info */}
                            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
                                <div className="flex items-center gap-2 text-rose-600 mb-2">
                                    <Stethoscope size={18} />
                                    <span className="font-bold text-sm">Medical & Safety Info</span>
                                    <span className="text-xs text-gray-400 font-normal ml-auto">For emergencies</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField
                                        icon={Droplets}
                                        label="Blood Group"
                                        value={regData.details_data.blood_group}
                                        onChange={(val) => updateDetailsData('blood_group', val)}
                                        options={bloodGroups}
                                        placeholder="Select"
                                    />
                                    <InputField
                                        label="Allergies"
                                        value={regData.details_data.allergies}
                                        onChange={(val) => updateDetailsData('allergies', val)}
                                        placeholder="e.g., Penicillin"
                                    />
                                </div>

                                <InputField
                                    icon={Stethoscope}
                                    label="Medical Conditions"
                                    value={regData.details_data.medical_conditions}
                                    onChange={(val) => updateDetailsData('medical_conditions', val)}
                                    placeholder="e.g., Diabetes, Asthma"
                                />

                                <InputField
                                    icon={AlertOctagon}
                                    label="Emergency Notes"
                                    value={regData.details_data.emergency_notes}
                                    onChange={(val) => updateDetailsData('emergency_notes', val)}
                                    placeholder="Any other important info"
                                />
                            </div>

                            {/* Preview Card */}
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[24px] p-6 text-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Ready to Activate!</h3>
                                        <p className="text-emerald-100 text-sm">Review your details</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4 space-y-2 text-sm backdrop-blur">
                                    <div className="flex justify-between">
                                        <span className="text-emerald-100">Owner</span>
                                        <span className="font-bold">{regData.owner_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-emerald-100">Vehicle</span>
                                        <span className="font-bold">{regData.vehicle_number || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-emerald-100">Type</span>
                                        <span className="font-bold capitalize">{regData.vehicle_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-emerald-100">Mobile</span>
                                        <span className="font-bold">+91 {regData.owner_mobile || '—'}</span>
                                    </div>
                                    {regData.insurance_pdf_url && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-100">Insurance</span>
                                            <span className="font-bold">✅ Uploaded</span>
                                        </div>
                                    )}
                                    {regData.details_data.city && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-100">Location</span>
                                            <span className="font-bold">{regData.details_data.city}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 z-50">
                    <div className="max-w-lg mx-auto">
                        {regStep === 4 ? (
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleActivate}
                                    disabled={regLoading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-[0.98] transition-all"
                                >
                                    {regLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Activating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={20} />
                                            Activate SafeDrive Tag
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="w-full py-3 text-gray-400 font-semibold flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                {regStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-all"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className={`flex-1 bg-gradient-to-r ${steps[regStep - 1].color} text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all`}
                                >
                                    Continue
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {renderModal()}
            </div>
        );
    }

    // ========== ACTIVATED VIEW ==========
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl" />
            </div>

            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-lg mx-auto px-5 h-16 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-none">SafeDrive</h1>
                        <p className="text-[10px] text-gray-400 font-medium">Contact Owner</p>
                    </div>
                </div>
            </header>

            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
                <div className="max-w-md mx-auto">
                    {/* Vehicle Card - Only show if vehicle data exists */}
                    {qrCode.vehicle_number && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                            <div className="phone-view relative bg-gradient-to-br from-white via-blue-10/50 to-indigo-50 rounded-3xl p-6 mb-5 border border-blue-100">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 bg-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                                        {/* ✅ FIXED: Dynamic Vehicle Icon */}
                                        {getVehicleIcon(qrCode.vehicle_type || 'car', 32)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                                                #{qrCode.qr_unique_id}
                                            </span>
                                            {qrCode.vehicle_type && (
                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg capitalize">
                                                    {qrCode.vehicle_type}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black mb-1 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                            {qrCode.vehicle_number}
                                        </h2>
                                        {(qrCode.vehicle_make || qrCode.vehicle_model || qrCode.vehicle_color) && (
                                            <p className="text-sm text-gray-600">
                                                {[qrCode.vehicle_make, qrCode.vehicle_model, qrCode.vehicle_color].filter(Boolean).join(' • ')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl flex-1 justify-center">
                                        <CheckCircle2 size={16} />
                                        <span className="text-xs font-bold">Verified Tag</span>
                                    </div>
                                    {(qrCode.insurance_pdf_url || (qrCode as any).insurance_pdf_url) && (
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl flex-1 justify-center">
                                            <Shield size={16} />
                                            <span className="text-xs font-bold">Insured</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* If no vehicle data, show owner card instead */}
                    {!qrCode.vehicle_number && qrCode.owner_name && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                            <div className=" relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50 rounded-3xl p-6 mb-5 shadow-2xl border border-blue-100">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <UserCircle size={32} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                                                #{qrCode.qr_unique_id}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                            {qrCode.owner_name}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            Contact Owner
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl flex-1 justify-center">
                                        <CheckCircle2 size={16} />
                                        <span className="text-xs font-bold">Verified Owner</span>
                                    </div>
                                    {(qrCode.insurance_pdf_url || (qrCode as any).insurance_pdf_url) && (
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl flex-1 justify-center">
                                            <Shield size={16} />
                                            <span className="text-xs font-bold">Insured</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="bg-white rounded-3xl p-5 mb-4 shadow-xl border border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Call Owner - Only if mobile exists */}
                            {qrCode.owner_mobile && (
                                <button
                                    onClick={() => window.location.href = `tel:${qrCode.owner_mobile}`}
                                    className="group bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 p-5 rounded-2xl flex flex-col items-center gap-2 hover:shadow-2xl hover:border-blue-400 hover:bg-gradient-to-b hover:from-blue-50 hover:to-white active:scale-95 transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                                        <PhoneCall size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">Call</span>
                                </button>
                            )}

                            {/* WhatsApp - Only if mobile/whatsapp exists */}
                            {(qrCode.owner_whatsapp || qrCode.owner_mobile) && (
                                <button
                                    onClick={() => {
                                        const mobile = qrCode.owner_whatsapp || qrCode.owner_mobile;
                                        const message = qrCode.vehicle_number
                                            ? `Hi, regarding your vehicle ${qrCode.vehicle_number}`
                                            : `Hi, I found your QR tag`;
                                        if (mobile) window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="group bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 p-5 rounded-2xl flex flex-col items-center gap-2 hover:shadow-2xl hover:border-emerald-400 hover:bg-gradient-to-b hover:from-emerald-50 hover:to-white active:scale-95 transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                                        <MessageSquare size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">Chat</span>
                                </button>
                            )}

                            {/* Emergency - Always show */}
                            <button
                                onClick={handleEmergency}
                                className="group bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 p-5 rounded-2xl flex flex-col items-center gap-2 hover:shadow-2xl hover:border-rose-400 hover:bg-gradient-to-b hover:from-rose-50 hover:to-white active:scale-95 transition-all"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                                    <Siren size={24} />
                                </div>
                                <span className="font-bold text-sm text-gray-800">SOS</span>
                            </button>

                            {/* Details - Only if any data exists */}
                            {(qrCode.owner_name || qrCode.vehicle_number || qrCode.details_data || qrCode.insurance_pdf_url) && (
                                <button
                                    onClick={() => {
                                        setModalConfig({
                                            isOpen: true,
                                            type: 'alert',
                                            title: 'Owner Details',
                                            message: 'details_view',
                                            priority: 'normal'
                                        });
                                    }}
                                    className="group bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 p-5 rounded-2xl flex flex-col items-center gap-2 hover:shadow-2xl hover:border-indigo-400 hover:bg-gradient-to-b hover:from-indigo-50 hover:to-white active:scale-95 transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                                        <Info size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">Details</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Emergency Helpline */}
                    <button
                        onClick={() => window.location.href = 'tel:8252472186'}
                        className="w-full bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 hover:from-red-100 hover:to-red-100 hover:border-red-300 active:scale-98 transition-all group"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-red-500 text-lg">🚨</span>
                            <span className="font-bold text-sm">Emergency Helpline: 24/7 Support</span>
                            <Phone size={14} className="text-red-500 group-hover:animate-bounce" />
                        </div>
                    </button>

                    {/* Powered By */}
                    <div className="text-center pb-6">
                        <a
                            href="https://testzonemedia.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-[10px]"
                        >
                            <span>Powered by</span>
                            <span className="font-semibold">TestZoneMedia</span>
                        </a>
                    </div>
                </div>
            </main>

            {renderModal()}
        </div>
    );
}