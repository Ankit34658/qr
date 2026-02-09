"use client";

import { useEffect, useState } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar, Download } from "lucide-react";
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

export default function ReportsPage() {
    const [stats, setStats] = useState({
        totalScans: 0,
        emergencyScans: 0,
        parkingScans: 0,
        growth: "+0%"
    });

    const [barData, setBarData] = useState<{ month: string, normal: number, emergency: number }[]>([]);
    const [pieData, setPieData] = useState<{ name: string, value: number, color: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch Totals
                const { count: total } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true });
                const { count: emergency } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scan_type', 'emergency');

                // 2. Fetch Log Data for Charts (Last 6 Months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                sixMonthsAgo.setDate(1);

                const { data: trendData } = await supabase
                    .from('scan_logs')
                    .select('created_at, scan_type')
                    .gte('created_at', sixMonthsAgo.toISOString());

                // Process Bar Chart Data (Group by Month)
                if (trendData) {
                    const monthMap = new Map<string, { scans: number, emergency: number }>();
                    const monthsOrder = [];

                    // Initialize last 6 months
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(1);
                        d.setMonth(d.getMonth() - i);
                        const monthKey = d.toLocaleString('default', { month: 'short' });
                        monthMap.set(monthKey, { scans: 0, emergency: 0 });
                        monthsOrder.push(monthKey);
                    }

                    trendData.forEach(log => {
                        const d = new Date(log.created_at);
                        const monthKey = d.toLocaleString('default', { month: 'short' });
                        if (monthMap.has(monthKey)) {
                            const entry = monthMap.get(monthKey)!;
                            if (log.scan_type === 'emergency') entry.emergency++;
                            else entry.scans++;
                        }
                    });

                    const finalBarData = monthsOrder.map(m => ({
                        month: m,
                        normal: monthMap.get(m)?.scans || 0,
                        emergency: monthMap.get(m)?.emergency || 0
                    }));

                    setBarData(finalBarData);
                }

                // Process Pie Data (Scan Types)
                const parkingScans = (total || 0) - (emergency || 0); // Approx
                setPieData([
                    { name: 'Regular Scans', value: parkingScans, color: '#3B82F6' },
                    { name: 'Emergency Alerts', value: emergency || 0, color: '#EF4444' }
                ]);

                setStats({
                    totalScans: total || 0,
                    emergencyScans: emergency || 0,
                    parkingScans: parkingScans,
                    growth: total && total > 10 ? "+12%" : "+0%" // Mock growth logic
                });

            } catch (err) {
                console.error("Failed to fetch report stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReportStats();
    }, []);


    const handleExport = () => {
        alert("Preparing your report for download...");
        // Future: Implement PDF/CSV generation
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1">Deep insights into vehicle scans and emergency patterns.</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition">
                        <Calendar size={18} /> Last 6 Months
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                    >
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-xl">Scan Volume Over Time</h3>
                        <div className="flex gap-2 text-xs font-bold uppercase">
                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Regular</div>
                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Emergency</div>
                        </div>
                    </div>
                    <div className="flex-grow w-full h-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="normal" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="emergency" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="font-bold text-xl mb-4">Scan Types</h3>
                    <div className="flex-grow flex items-center justify-center min-h-[250px] relative">
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
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-900">{stats.totalScans}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Total</span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div> Response Rate
                            </span>
                            <span className="font-bold">64%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
