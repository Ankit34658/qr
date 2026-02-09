"use client";

import {
    LayoutDashboard,
    QrCode,
    Car,
    History,
    BarChart3,
    Settings,
    LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin/dashboard" },
    { icon: <QrCode size={20} />, label: "QR Codes", href: "/admin/qr-codes" },
    { icon: <Car size={20} />, label: "Vehicles", href: "/admin/vehicles" },
    { icon: <History size={20} />, label: "Scan Logs", href: "/admin/scan-logs" },
    { icon: <BarChart3 size={20} />, label: "Reports", href: "/admin/reports" },
    { icon: <Settings size={20} />, label: "Settings", href: "/admin/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r flex flex-col h-full">
            <div className="p-6 border-b flex items-center gap-3">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <QrCode className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-gray-900">SafeDrive</span>
            </div>

            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition font-medium w-full">
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
