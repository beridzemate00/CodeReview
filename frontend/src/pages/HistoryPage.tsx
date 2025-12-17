import { useEffect, useState } from 'react';
import { History, Search, Filter, Code2, FileCode, X, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ReviewHistoryItem {
    id: string;
    content: any[];
    codeSnippet: string | null;
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

export function HistoryPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();

    const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [languageFilter, setLanguageFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'quality' | 'issues'>('date');
    const [selectedReview, setSelectedReview] = useState<ReviewHistoryItem | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/review/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
            } else if (response.status === 403 || response.status === 401) {
                setError('Please sign in to view your history');
            }
        } catch (err) {
            setError('Failed to load review history');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 80) return 'bg-green-500/10';
        if (score >= 60) return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    const getLanguageColor = (lang: string): string => {
        const colors: Record<string, string> = {
            typescript: 'bg-blue-500',
            javascript: 'bg-yellow-500',
            python: 'bg-green-500',
            java: 'bg-orange-500',
            go: 'bg-cyan-500',
            rust: 'bg-orange-600',
            cpp: 'bg-purple-500'
        };
        return colors[lang] || 'bg-gray-500';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (hours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    const filteredReviews = reviews
        .filter(r => {
            const matchesSearch = searchTerm === '' ||
                r.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.language.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLanguage = languageFilter === '' || r.language === languageFilter;
            const matchesSeverity = severityFilter === '' ||
                (severityFilter === 'high' && r.highSeverity > 0) ||
                (severityFilter === 'medium' && r.mediumSeverity > 0) ||
                (severityFilter === 'low' && r.lowSeverity > 0);
            return matchesSearch && matchesLanguage && matchesSeverity;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'quality':
                    return b.qualityScore - a.qualityScore;
                case 'issues':
                    return b.issueCount - a.issueCount;
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    const languages = [...new Set(reviews.map(r => r.language))];

    const stats = {
        total: reviews.length,
        thisWeek: reviews.filter(r => {
            const date = new Date(r.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
        }).length,
        avgQuality: reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.qualityScore, 0) / reviews.length
            : 0
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <History size={48} className="text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign in to view your history</h2>
                <p className="text-[var(--text-muted)] mb-4">Your code review history will appear here</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">Sign In</button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Review History</h1>
                    <p className="text-[var(--text-secondary)]">Browse your past code reviews</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <p className="text-sm text-[var(--text-muted)]">Total Reviews</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-[var(--text-muted)]">This Week</p>
                    <p className="text-2xl font-bold text-[var(--accent-blue)]">{stats.thisWeek}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-[var(--text-muted)]">Avg Quality</p>
                    <p className={`text-2xl font-bold ${getScoreColor(stats.avgQuality)}`}>{stats.avgQuality.toFixed(0)}%</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by filename or language..."
                        className="input pl-10"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                >
                    <Filter size={18} /> Filters
                </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
                <div className="card p-4 mb-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Language</label>
                            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} className="input">
                                <option value="">All Languages</option>
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Severity</label>
                            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input">
                                <option value="">All Severities</option>
                                <option value="high">Has High Issues</option>
                                <option value="medium">Has Medium Issues</option>
                                <option value="low">Has Low Issues</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Sort By</label>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input">
                                <option value="date">Most Recent</option>
                                <option value="quality">Highest Quality</option>
                                <option value="issues">Most Issues</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)] mb-4">
                    {error}
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-4">
                            <div className="skeleton h-5 w-1/3 rounded mb-3"></div>
                            <div className="skeleton h-4 w-full rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                    <History size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        {reviews.length === 0 ? 'No reviews yet' : 'No matching reviews'}
                    </h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        {reviews.length === 0 ? 'Start reviewing code to build your history' : 'Try adjusting your filters'}
                    </p>
                    {reviews.length === 0 && (
                        <button onClick={() => navigate('/')} className="btn btn-primary">
                            <Code2 size={18} /> Review Code
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReviews.map(review => (
                        <div
                            key={review.id}
                            className="card p-4 hover:border-[var(--accent-blue)]/50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedReview(review)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${getLanguageColor(review.language)} flex items-center justify-center`}>
                                        <FileCode size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                                            {review.fileName}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                            <span className="capitalize">{review.language}</span>
                                            <span>•</span>
                                            <span>{review.linesOfCode} lines</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Issue badges */}
                                    <div className="hidden md:flex items-center gap-2">
                                        {review.highSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">
                                                <AlertTriangle size={10} /> {review.highSeverity}
                                            </span>
                                        )}
                                        {review.mediumSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full">
                                                {review.mediumSeverity}
                                            </span>
                                        )}
                                        {review.lowSeverity > 0 && (
                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">
                                                {review.lowSeverity}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quality Score */}
                                    <div className={`px-3 py-1 rounded-lg ${getScoreBg(review.qualityScore)}`}>
                                        <span className={`text-sm font-semibold ${getScoreColor(review.qualityScore)}`}>
                                            {Math.round(review.qualityScore)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Code preview on hover */}
                            {review.codeSnippet && (
                                <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                                    <pre className="text-xs text-[var(--text-muted)] truncate">
                                        {review.codeSnippet.substring(0, 150)}...
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Review Detail Modal */}
            {selectedReview && (
                <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
                    <div className="modal max-w-3xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedReview.fileName}</h2>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {selectedReview.language} • {selectedReview.linesOfCode} lines • {formatDate(selectedReview.createdAt)}
                                </p>
                            </div>
                            <button onClick={() => setSelectedReview(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body max-h-[60vh] overflow-y-auto">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className={`p-3 rounded-lg ${getScoreBg(selectedReview.qualityScore)}`}>
                                    <p className="text-xs text-[var(--text-muted)]">Quality</p>
                                    <p className={`text-xl font-bold ${getScoreColor(selectedReview.qualityScore)}`}>
                                        {Math.round(selectedReview.qualityScore)}%
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                    <p className="text-xs text-[var(--text-muted)]">Issues</p>
                                    <p className="text-xl font-bold text-[var(--text-primary)]">{selectedReview.issueCount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-500/10">
                                    <p className="text-xs text-[var(--text-muted)]">High</p>
                                    <p className="text-xl font-bold text-red-500">{selectedReview.highSeverity}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-yellow-500/10">
                                    <p className="text-xs text-[var(--text-muted)]">Medium</p>
                                    <p className="text-xl font-bold text-yellow-500">{selectedReview.mediumSeverity}</p>
                                </div>
                            </div>

                            {/* Code snippet */}
                            {selectedReview.codeSnippet && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Code Snippet</h4>
                                    <pre className="p-4 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] overflow-x-auto">
                                        {selectedReview.codeSnippet}
                                    </pre>
                                </div>
                            )}

                            {/* Issues */}
                            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                                Issues ({selectedReview.content?.length || 0})
                            </h4>
                            <div className="space-y-2">
                                {selectedReview.content?.slice(0, 10).map((issue: any, i: number) => (
                                    <div key={i} className={`p-3 rounded-lg border ${issue.severity === 'high' ? 'border-red-500/30 bg-red-500/5' :
                                        issue.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                                            'border-blue-500/30 bg-blue-500/5'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${issue.severity === 'high' ? 'bg-red-500 text-white' :
                                                issue.severity === 'medium' ? 'bg-yellow-500 text-black' :
                                                    'bg-blue-500 text-white'
                                                }`}>
                                                {issue.severity}
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">Line {issue.line}</span>
                                            <span className="text-xs text-[var(--text-muted)] capitalize">{issue.type}</span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)]">{issue.message}</p>
                                        {issue.suggestion && (
                                            <p className="text-xs text-[var(--accent-blue)] mt-1">💡 {issue.suggestion}</p>
                                        )}
                                    </div>
                                ))}
                                {(selectedReview.content?.length || 0) > 10 && (
                                    <p className="text-sm text-[var(--text-muted)] text-center">
                                        + {selectedReview.content.length - 10} more issues
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedReview(null)} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
