import React, { useEffect, useState } from 'react';
import { History, Clock, Code2, AlertTriangle, CheckCircle, ChevronRight, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReviewHistory {
    id: string;
    codeSnippet: string;
    language: string;
    fileName: string;
    linesOfCode: number;
    issueCount: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    qualityScore: number;
    createdAt: string;
}

export const HistoryPage: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${apiUrl}/api/review/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            const data = await response.json();
            setReviews(data.reviews || []);
        } catch (err) {
            setError('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/10 border-green-500/30';
        if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    const getLanguageIcon = (lang: string) => {
        const colors: Record<string, string> = {
            javascript: 'bg-yellow-500',
            typescript: 'bg-blue-500',
            python: 'bg-green-500',
            java: 'bg-orange-500',
            go: 'bg-cyan-500',
            rust: 'bg-orange-600',
            ruby: 'bg-red-500',
            php: 'bg-purple-500',
            csharp: 'bg-purple-600',
            cpp: 'bg-blue-600',
            swift: 'bg-orange-400',
            kotlin: 'bg-purple-400',
        };
        return colors[lang.toLowerCase()] || 'bg-neutral-500';
    };

    if (loading) {
        return (
            <div className="p-8 max-w-6xl mx-auto animate-fade-in">
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-neutral-800 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
                                    <div className="h-3 bg-neutral-800 rounded w-1/3"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <History className="text-blue-500" />
                    Review History
                </h1>
                <p className="text-neutral-400">View and revisit your past code reviews.</p>
            </header>

            {reviews.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-4">
                        <FileCode size={32} className="text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto">
                        Start reviewing code to build your history. Your reviews will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Start Reviewing
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Language Badge */}
                                <div className={`w-12 h-12 rounded-lg ${getLanguageIcon(review.language)} flex items-center justify-center`}>
                                    <Code2 size={24} className="text-white" />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-white truncate">
                                            {review.fileName}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-400 uppercase">
                                            {review.language}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatDate(review.createdAt)}
                                        </span>
                                        <span>{review.linesOfCode} lines</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6">
                                    {/* Issue Counts */}
                                    <div className="flex items-center gap-3">
                                        {review.highSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-red-400 text-sm">
                                                <AlertTriangle size={14} />
                                                {review.highSeverity}
                                            </span>
                                        )}
                                        {review.mediumSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                                <AlertTriangle size={14} />
                                                {review.mediumSeverity}
                                            </span>
                                        )}
                                        {review.lowSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-blue-400 text-sm">
                                                <AlertTriangle size={14} />
                                                {review.lowSeverity}
                                            </span>
                                        )}
                                        {review.issueCount === 0 && (
                                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                                <CheckCircle size={14} />
                                                Clean
                                            </span>
                                        )}
                                    </div>

                                    {/* Quality Score */}
                                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(review.qualityScore)}`}>
                                        <span className={`text-lg font-bold ${getScoreColor(review.qualityScore)}`}>
                                            {review.qualityScore}
                                        </span>
                                        <span className="text-neutral-500 text-sm ml-1">/100</span>
                                    </div>

                                    <ChevronRight size={20} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                                </div>
                            </div>

                            {/* Code Preview */}
                            {review.codeSnippet && (
                                <div className="mt-4 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                                    <pre className="text-xs text-neutral-400 font-mono overflow-hidden whitespace-nowrap text-ellipsis">
                                        {review.codeSnippet.substring(0, 150)}...
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
