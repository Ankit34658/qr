"use client";

import { useEffect, useState } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface ChartData {
    month: string;
    normal: number;
    emergency: number;
}

interface PieData {
    name: string;
    value: number;
    color: string;
}

interface Stats {
    totalScans: number;
    emergencyScans: number;
    parkingScans: number;
    growth: string;
}

export default function ReportsPage() {
    const [stats, setStats] = useState<Stats>({
        totalScans: 0,
        emergencyScans: 0,
        parkingScans: 0,
        growth: "+0%"
    });

    const [barData, setBarData] = useState<ChartData[]>([]);
    const [pieData, setPieData] = useState<PieData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("6months");

    useEffect(() => {
        const fetchReportStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch Totals
                const { count: total } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true });

                const { count: emergency } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('scan_type', 'emergency');

                // 2. Fetch Log Data for Charts (Last 6 Months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                sixMonthsAgo.setDate(1);
                sixMonthsAgo.setHours(0, 0, 0, 0);

                const { data: trendData, error } = await supabase
                    .from('scan_logs')
                    .select('created_at, scan_type')
                    .gte('created_at', sixMonthsAgo.toISOString());

                if (error) throw error;

                // Process Bar Chart Data (Group by Month)
                if (trendData) {
                    const monthMap = new Map<string, { normal: number, emergency: number }>();
                    const monthsOrder: string[] = [];

                    // Initialize last 6 months
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(1);
                        d.setMonth(d.getMonth() - i);
                        const monthKey = d.toLocaleString('default', { month: 'short' });
                        monthMap.set(monthKey, { normal: 0, emergency: 0 });
                        monthsOrder.push(monthKey);
                    }

                    // Count scans per month
                    trendData.forEach(log => {
                        const d = new Date(log.created_at);
                        const monthKey = d.toLocaleString('default', { month: 'short' });
                        const currentData = monthMap.get(monthKey);
                        if (currentData) {
                            if (log.scan_type === 'emergency') {
                                currentData.emergency++;
                            } else {
                                currentData.normal++;
                            }
                            monthMap.set(monthKey, currentData);
                        }
                    });

                    const finalBarData = monthsOrder.map(month => ({
                        month,
                        normal: monthMap.get(month)?.normal || 0,
                        emergency: monthMap.get(month)?.emergency || 0
                    }));

                    setBarData(finalBarData);
                }

                // Process Pie Data (Scan Types)
                const normalScans = (total || 0) - (emergency || 0);
                const pieChartData: PieData[] = [
                    { name: 'Regular Scans', value: normalScans, color: '#3B82F6' },
                    { name: 'Emergency Alerts', value: emergency || 0, color: '#EF4444' }
                ];
                setPieData(pieChartData);

                // Calculate growth (compare current month to previous month)
                let growthPercentage = "0";
                if (trendData && trendData.length > 0) {
                    const currentMonth = new Date().getMonth();
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

                    const currentMonthScans = trendData.filter(log =>
                        new Date(log.created_at).getMonth() === currentMonth
                    ).length;

                    const lastMonthScans = trendData.filter(log =>
                        new Date(log.created_at).getMonth() === lastMonth
                    ).length;

                    if (lastMonthScans > 0) {
                        const growth = ((currentMonthScans - lastMonthScans) / lastMonthScans) * 100;
                        growthPercentage = growth > 0 ? `+${growth.toFixed(0)}` : growth.toFixed(0);
                    }
                }

                setStats({
                    totalScans: total || 0,
                    emergencyScans: emergency || 0,
                    parkingScans: normalScans,
                    growth: `${growthPercentage}%`
                });

            } catch (err) {
                console.error("Failed to fetch report stats:", err);
                // Set default data on error
                setPieData([
                    { name: 'Regular Scans', value: 0, color: '#3B82F6' },
                    { name: 'Emergency Alerts', value: 0, color: '#EF4444' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchReportStats();
    }, []);

    const handleExport = async () => {
        // Simple CSV export
        const csvHeaders = ["Month", "Normal Scans", "Emergency Scans"];
        const csvRows = barData.map(row => [row.month, row.normal, row.emergency]);
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs text-gray-600">
                            <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-[600px] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 size={48} className="animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-500 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1">Deep insights into vehicle scans and emergency patterns.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-2xl font-semibold text-gray-600 hover:bg-gray-50 transition">
                        <Calendar size={18} /> Last 6 Months
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <BarChart3 size={24} className="text-blue-600" />
                        </div>
                        <span className={`text-sm font-semibold ${stats.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.growth}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalScans}</h3>
                    <p className="text-sm text-gray-500">Total Scans</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={24} className="text-red-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.emergencyScans}</h3>
                    <p className="text-sm text-gray-500">Emergency Alerts</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                            <PieChartIcon size={24} className="text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.parkingScans}</h3>
                    <p className="text-sm text-gray-500">Regular Scans</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <BarChart3 size={24} className="text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats.totalScans > 0 ? Math.round((stats.emergencyScans / stats.totalScans) * 100) : 0}%
                    </h3>
                    <p className="text-sm text-gray-500">Emergency Rate</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-xl text-gray-900">Scan Volume Over Time</h3>
                        <div className="flex gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-blue-500"></span>
                                <span className="text-gray-600">Regular</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-red-500"></span>
                                <span className="text-gray-600">Emergency</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="normal" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="emergency" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-xl text-gray-900 mb-6">Scan Types Distribution</h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-900">{stats.totalScans}</span>
                            <span className="text-xs text-gray-500 font-medium uppercase">Total</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {pieData.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    {item.name}
                                </span>
                                <span className="font-bold text-gray-900">
                                    {item.value} ({stats.totalScans > 0 ? Math.round((item.value / stats.totalScans) * 100) : 0}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}