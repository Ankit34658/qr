"use client";

import { useState, useRef, useEffect } from "react";
import {
    LayoutDashboard,
    QrCode,
    Car,
    History,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    Menu,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin/dashboard" },
    { icon: <QrCode size={20} />, label: "QR Codes", href: "/admin/qr-codes" },
    { icon: <Car size={20} />, label: "Vehicles", href: "/admin/vehicles" },
    { icon: <History size={20} />, label: "Scan Logs", href: "/admin/scan-logs" },
    { icon: <BarChart3 size={20} />, label: "Reports", href: "/admin/reports" },
    { icon: <Settings size={20} />, label: "Settings", href: "/admin/settings" },
];

type Notification = {
    id: string;
    message: string;
    time: string;
    type: string;
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notificationRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Fetch real notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
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

                if (scans) {
                    const notifs: Notification[] = scans.map((scan: any) => {
                        const timeAgo = getTimeAgo(new Date(scan.created_at));
                        const vehicleNum = scan.qr_codes?.vehicle_number || 'Unknown';
                        const isEmergency = scan.scan_type === 'emergency';

                        return {
                            id: scan.id,
                            message: isEmergency
                                ? `🚨 Emergency scan for ${vehicleNum}`
                                : `QR Code scanned: ${vehicleNum}`,
                            time: timeAgo,
                            type: scan.scan_type
                        };
                    });
                    setNotifications(notifs);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };


    // Close notifications dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationRef]);

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.full_name) return "AD";
        const names = user.full_name.split(" ");
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return user.full_name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col transition-all duration-500 lg:relative lg:translate-x-0 shadow-2xl shadow-gray-200/50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <QrCode className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">SafeDrive</span>
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-grow p-6 space-y-2 overflow-y-auto scrollbar-hide">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 font-bold text-sm group ${isActive
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`}>
                                    {item.icon}
                                </div>
                                <span className="tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-[22px] transition-all duration-300 font-black text-sm w-full group"
                    >
                        <div className="group-hover:rotate-12 transition-transform">
                            <LogOut size={20} />
                        </div>
                        Logout Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col overflow-hidden w-full">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-50 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="lg:hidden p-2.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-100 transition">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight hidden sm:block">
                            {sidebarItems.find(i => i.href === pathname)?.label || "Overview"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="p-4 border-b">
                                        <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                        <p className="text-xs text-gray-500 mt-1">{notifications.length} recent activities</p>
                                    </div>
                                    <div className="py-1 max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-400">
                                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <Link
                                                    key={notif.id}
                                                    href="/admin/scan-logs"
                                                    onClick={() => setIsNotificationsOpen(false)}
                                                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                >
                                                    <p className="font-medium">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-4 border-t text-center">
                                        <Link
                                            href="/admin/scan-logs"
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            View All Scan Logs
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/admin/settings" className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 md:p-2 rounded-2xl transition border border-transparent hover:border-gray-100">
                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                                {getUserInitials()}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-black text-gray-900 leading-tight">{user?.full_name || "Admin User"}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Premium Plan</p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-grow overflow-y-auto p-4 md:p-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
