import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
}

export default function StatsCard({ label, value, icon, color, trend }: StatsCardProps) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover-lift">
            <div className="flex justify-between items-start mb-4">
                <div className={`${color} p-3 rounded-2xl text-white`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
    );
}
