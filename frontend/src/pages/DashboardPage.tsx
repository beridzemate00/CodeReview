import React, { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, Code2, FileCode, BarChart3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
    totalReviews: number;
    totalIssues: number;
    totalHigh: number;
    totalMedium: number;
    totalLow: number;
    totalLinesOfCode: number;
    avgQualityScore: number;
    languageBreakdown: Record<string, number>;
    trendData: { date: string; reviews: number; avgScore: number }[];
}

const defaultStats: DashboardStats = {
    totalReviews: 0,
    totalIssues: 0,
    totalHigh: 0,
    totalMedium: 0,
    totalLow: 0,
    totalLinesOfCode: 0,
    avgQualityScore: 0,
    languageBreakdown: {},
    trendData: [],
};

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>(defaultStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchStats();
    }, [isAuthenticated, navigate]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            if (!token) {
                setStats(defaultStats);
                setLoading(false);
                return;
            }

            const response = await fetch(`${apiUrl}/api/review/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                // Token expired or invalid - show empty state instead of redirecting
                setStats(defaultStats);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError('Failed to load dashboard data');
            setStats(defaultStats);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-600';
        if (score >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-blue-500 to-indigo-600';
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <LayoutDashboard className="text-blue-500" />
                        Dashboard
                    </h1>
                    <p className="text-neutral-400">Loading your activity overview...</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 animate-pulse">
                            <div className="h-4 bg-neutral-800 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-neutral-800 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <LayoutDashboard className="text-blue-500" />
                            Dashboard
                        </h1>
                        <p className="text-neutral-400">Overview of your code review activity and metrics.</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Quality Score */}
                <div className={`bg-gradient-to-br ${getScoreGradient(stats.avgQualityScore)} rounded-xl p-6 shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-white/80 font-medium">Avg Quality Score</span>
                        <TrendingUp className="text-white/60" size={20} />
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {stats.avgQualityScore || 0}
                        <span className="text-lg text-white/60">/100</span>
                    </div>
                </div>

                {/* Total Reviews */}
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 font-medium">Total Reviews</span>
                        <FileCode className="text-blue-500" size={20} />
                    </div>
                    <div className="text-4xl font-bold text-white">{stats.totalReviews || 0}</div>
                    <div className="text-sm text-neutral-500 mt-1">{(stats.totalLinesOfCode || 0).toLocaleString()} lines analyzed</div>
                </div>

                {/* Issues Found */}
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 font-medium">Issues Found</span>
                        <AlertTriangle className="text-yellow-500" size={20} />
                    </div>
                    <div className="text-4xl font-bold text-white">{stats.totalIssues || 0}</div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-red-400">{stats.totalHigh || 0} high</span>
                        <span className="text-xs text-yellow-400">{stats.totalMedium || 0} medium</span>
                        <span className="text-xs text-blue-400">{stats.totalLow || 0} low</span>
                    </div>
                </div>

                {/* Clean Code */}
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 font-medium">Clean Reviews</span>
                        <CheckCircle className="text-green-500" size={20} />
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {stats.totalReviews > 0
                            ? Math.round((1 - stats.totalIssues / Math.max(1, stats.totalReviews * 10)) * 100)
                            : 100}%
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">Low issue rate</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Activity Trend */}
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">7-Day Activity</h3>
                    {stats.trendData && stats.trendData.length > 0 ? (
                        <div className="flex items-end justify-between h-32 gap-2">
                            {stats.trendData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-600 rounded-t transition-all"
                                        style={{ height: `${Math.max(8, (day.reviews / Math.max(...stats.trendData.map(d => d.reviews), 1)) * 100)}%` }}
                                    ></div>
                                    <span className="text-xs text-neutral-500 mt-2">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-neutral-500">
                            No activity data yet
                        </div>
                    )}
                </div>

                {/* Language Breakdown */}
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Languages</h3>
                    <div className="space-y-4">
                        {stats.languageBreakdown && Object.keys(stats.languageBreakdown).length > 0 ? (
                            Object.entries(stats.languageBreakdown).slice(0, 5).map(([lang, count]) => {
                                const percentage = (count / Math.max(stats.totalReviews, 1)) * 100;
                                const colors: Record<string, string> = {
                                    javascript: 'bg-yellow-500',
                                    typescript: 'bg-blue-500',
                                    python: 'bg-green-500',
                                    java: 'bg-orange-500',
                                    go: 'bg-cyan-500',
                                    rust: 'bg-orange-600',
                                };
                                return (
                                    <div key={lang}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-neutral-300 capitalize">{lang}</span>
                                            <span className="text-sm text-neutral-500">{count} reviews</span>
                                        </div>
                                        <div className="w-full bg-neutral-800 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${colors[lang.toLowerCase()] || 'bg-neutral-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-neutral-500 text-center py-4">No language data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Code2 size={18} />
                        New Review
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <FileCode size={18} />
                        View History
                    </button>
                </div>
            </div>
        </div>
    );
};
