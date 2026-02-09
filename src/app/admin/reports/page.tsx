"use client";

import { useEffect, useState } from "react";
import { BarChart3, PieChart, TrendingUp, Calendar, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ReportsPage() {
    const [stats, setStats] = useState({
        totalScans: 0,
        emergencyScans: 0,
        parkingScans: 0,
        growth: "+0%"
    });

    const [chartData, setChartData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportStats = async () => {
            setLoading(true);
            try {
                const { count: total } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true });
                const { count: emergency } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scan_type', 'emergency');

                // Fetch logs from last 12 months for chart
                const twelveMonthsAgo = new Date();
                twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
                twelveMonthsAgo.setDate(1);

                const { data: trendData } = await supabase
                    .from('scan_logs')
                    .select('created_at')
                    .gte('created_at', twelveMonthsAgo.toISOString());

                // Group by month
                const months = new Array(12).fill(0);
                if (trendData) {
                    trendData.forEach(log => {
                        const date = new Date(log.created_at);
                        const monthDiff = (new Date().getFullYear() - date.getFullYear()) * 12 + (new Date().getMonth() - date.getMonth());
                        if (monthDiff < 12) {
                            months[11 - monthDiff]++;
                        }
                    });
                }
                setChartData(months);

                setStats({
                    totalScans: total || 0,
                    emergencyScans: emergency || 0,
                    parkingScans: (total || 0) - (emergency || 0),
                    growth: total && total > 10 ? "+15%" : "+0%"
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
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1">Deep insights into vehicle scans and emergency patterns.</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition">
                        <Calendar size={18} /> Last 30 Days
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
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-xl">Scan Volume Over Time</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                            <span className="text-xs text-gray-400 font-bold uppercase">General ({stats.parkingScans})</span>
                            <span className="w-3 h-3 bg-red-600 rounded-full ml-4"></span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Emergency ({stats.emergencyScans})</span>
                        </div>
                    </div>
                    <div className="h-64 bg-gray-50 rounded-3xl flex items-end justify-between p-8 gap-2">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold animate-pulse">
                                Calculating Trends...
                            </div>
                        ) : chartData.map((h, i) => (
                            <div key={i} className="w-full bg-blue-600/20 rounded-t-lg relative group">
                                <div
                                    style={{ height: `${Math.max((h / (Math.max(...chartData) || 1)) * 100, 5)}%` }}
                                    className="bg-blue-600 rounded-t-lg transition-all group-hover:bg-blue-700"
                                    title={`${h} scans`}
                                ></div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="font-bold text-xl mb-8">Contact Resolution</h3>
                    <div className="flex-grow flex items-center justify-center relative">
                        <div className="w-48 h-48 rounded-full border-[20px] border-blue-600" style={{ borderRightColor: '#10B981', borderBottomColor: '#F3F4F6', transform: 'rotate(-45deg)' }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-900">{stats.totalScans}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Total Scans</span>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div> Response Rate
                            </span>
                            <span className="font-bold">64%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div> Successful Connect
                            </span>
                            <span className="font-bold">28%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
