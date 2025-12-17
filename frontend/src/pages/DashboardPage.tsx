import { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, Code2, FileCode, BarChart3, RefreshCw, Zap, Shield, Bug, BookOpen } from 'lucide-react';
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

export function DashboardPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [stats, setStats] = useState<DashboardStats>(defaultStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/review/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else if (response.status === 403 || response.status === 401) {
                setError('Please sign in to view your dashboard');
            }
        } catch (err: any) {
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreGradient = (score: number): string => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    const getLanguageColor = (lang: string): string => {
        const colors: Record<string, string> = {
            typescript: 'bg-blue-500',
            javascript: 'bg-yellow-500',
            python: 'bg-green-500',
            java: 'bg-orange-500',
            go: 'bg-cyan-500',
            rust: 'bg-orange-600',
            cpp: 'bg-purple-500',
            ruby: 'bg-red-500',
            php: 'bg-indigo-500'
        };
        return colors[lang] || 'bg-gray-500';
    };

    const totalLanguages = Object.values(stats.languageBreakdown).reduce((a, b) => a + b, 0);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <LayoutDashboard size={48} className="text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign in to view your dashboard</h2>
                <p className="text-[var(--text-muted)] mb-4">Track your code review history and statistics</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">
                    Sign In
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-6">
                        <div className="skeleton h-4 w-20 rounded mb-3"></div>
                        <div className="skeleton h-8 w-16 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Dashboard</h1>
                    <p className="text-[var(--text-secondary)]">Overview of your code review activity</p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)]">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-sm">Total Reviews</span>
                        <FileCode size={20} className="text-[var(--accent-blue)]" />
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalReviews}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">All time</p>
                </div>

                <div className="stat-card p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-sm">Avg Quality</span>
                        <Zap size={20} className={getScoreColor(stats.avgQualityScore)} />
                    </div>
                    <p className={`text-3xl font-bold ${getScoreColor(stats.avgQualityScore)}`}>
                        {stats.avgQualityScore.toFixed(1)}%
                    </p>
                    <div className="mt-2 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getScoreGradient(stats.avgQualityScore)} transition-all duration-500`}
                            style={{ width: `${stats.avgQualityScore}%` }}
                        />
                    </div>
                </div>

                <div className="stat-card p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-sm">Issues Found</span>
                        <Bug size={20} className="text-[var(--accent-orange)]" />
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalIssues}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-red-500">{stats.totalHigh} high</span>
                        <span className="text-xs text-yellow-500">{stats.totalMedium} med</span>
                        <span className="text-xs text-blue-500">{stats.totalLow} low</span>
                    </div>
                </div>

                <div className="stat-card p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-sm">Lines Reviewed</span>
                        <Code2 size={20} className="text-[var(--accent-purple)]" />
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {stats.totalLinesOfCode.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Total lines analyzed</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <div className="lg:col-span-2 card p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-[var(--accent-blue)]" />
                        7-Day Activity
                    </h3>
                    <div className="h-48 flex items-end gap-2">
                        {stats.trendData.length > 0 ? (
                            stats.trendData.map((day, i) => {
                                const maxReviews = Math.max(...stats.trendData.map(d => d.reviews), 1);
                                const height = (day.reviews / maxReviews) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-gradient-to-t from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-t-lg transition-all duration-500 hover:opacity-80"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                            title={`${day.reviews} reviews`}
                                        />
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
                                No activity data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Language Breakdown */}
                <div className="card p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-[var(--accent-purple)]" />
                        Languages
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.languageBreakdown).length > 0 ? (
                            Object.entries(stats.languageBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([lang, count]) => (
                                    <div key={lang}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-[var(--text-primary)] capitalize">{lang}</span>
                                            <span className="text-xs text-[var(--text-muted)]">{count}</span>
                                        </div>
                                        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getLanguageColor(lang)} transition-all duration-500`}
                                                style={{ width: `${(count / totalLanguages) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <p className="text-[var(--text-muted)] text-sm text-center py-4">No language data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Severity Breakdown */}
            <div className="card p-6">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-[var(--accent-green)]" />
                    Issues by Severity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">High Severity</span>
                        </div>
                        <p className="text-2xl font-bold text-red-500">{stats.totalHigh}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {stats.totalIssues > 0 ? ((stats.totalHigh / stats.totalIssues) * 100).toFixed(0) : 0}% of total
                        </p>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={18} className="text-yellow-500" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">Medium Severity</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-500">{stats.totalMedium}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {stats.totalIssues > 0 ? ((stats.totalMedium / stats.totalIssues) * 100).toFixed(0) : 0}% of total
                        </p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-blue-500" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">Low Severity</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-500">{stats.totalLow}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {stats.totalIssues > 0 ? ((stats.totalLow / stats.totalIssues) * 100).toFixed(0) : 0}% of total
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="card p-5 text-left hover:border-[var(--accent-blue)]/50 transition-colors group"
                >
                    <Code2 size={24} className="text-[var(--accent-blue)] mb-2" />
                    <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)]">New Review</h4>
                    <p className="text-sm text-[var(--text-muted)]">Start reviewing code</p>
                </button>
                <button
                    onClick={() => navigate('/history')}
                    className="card p-5 text-left hover:border-[var(--accent-purple)]/50 transition-colors group"
                >
                    <BookOpen size={24} className="text-[var(--accent-purple)] mb-2" />
                    <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-purple)]">View History</h4>
                    <p className="text-sm text-[var(--text-muted)]">Browse past reviews</p>
                </button>
                <button
                    onClick={() => navigate('/projects')}
                    className="card p-5 text-left hover:border-[var(--accent-green)]/50 transition-colors group"
                >
                    <FileCode size={24} className="text-[var(--accent-green)] mb-2" />
                    <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">Projects</h4>
                    <p className="text-sm text-[var(--text-muted)]">Manage your projects</p>
                </button>
            </div>
        </div>
    );
}
