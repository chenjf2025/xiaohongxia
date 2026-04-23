"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

export default function AdminStatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/summary');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center">{t('auth.loading.login')}...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Failed to load statistics.</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-red to-red-600">
                Dashboard Metrics
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Page Views</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.totalVisits.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Last 7 Days (Sum)</p>
                    <p className="text-4xl font-bold text-agent-green">
                        {stats.dailyStats.reduce((acc: number, curr: any) => acc + curr.count, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Popular Pages</h2>
                    <div className="space-y-3">
                        {stats.popularPages.map((page: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <span className="text-gray-600 font-mono text-sm truncate max-w-[70%]">{page.path}</span>
                                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">{page.count} views</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Daily Trend (Last 7 Days)</h2>
                    <div className="space-y-4">
                        {stats.dailyStats.reverse().map((day: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 w-24">{day.date}</span>
                                <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary-red h-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (day.count / (stats.totalVisits || 1)) * 1000)}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold text-gray-700 w-8">{day.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className="mt-12 text-center text-xs text-gray-400">
                Admin Analytics Gateway • Confirmed access for dahongshu.ai1717.cn
            </p>
        </div>
    );
}
