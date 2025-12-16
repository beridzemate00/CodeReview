import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Clipboard, FileText, Brain, Shield, Zap, BookOpen, Bug } from 'lucide-react';
import { ReviewCard } from '../components/review/ReviewCard';
import { useSettings } from '../context/SettingsContext';

interface MLMetrics {
    linesOfCode: number;
    commentRatio: number;
    nestingDepth: number;
    functionCount: number;
    classCount: number;
}

interface ReviewStats {
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    qualityScore: number;
    readabilityScore?: number;
    maintainabilityScore?: number;
    securityScore?: number;
    performanceScore?: number;
    predictedBugRisk?: number;
}

export function ReviewPage() {
    const { settings } = useSettings();
    const [code, setCode] = useState(`// Paste your code here to review...

function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// TODO: Add validation
const password = "secret123";
console.log("Debug:", password);
`);
    const [language, setLanguage] = useState(settings.defaultLanguage || 'typescript');
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);

    const handleReview = async () => {
        setIsReviewing(true);
        setReviews([]);
        setStats(null);
        setMlMetrics(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    code,
                    language,
                    enableML: settings.enableAI,
                    enableAI: settings.enableAI && !!settings.apiKey,
                    apiKey: settings.apiKey || undefined,
                    fileName: 'review.ts'
                }),
            });
            const data = await response.json();

            // Filter by severity settings
            const filteredReviews = (data.reviews || []).filter((r: any) =>
                settings.severityFilter.includes(r.severity)
            );

            setReviews(filteredReviews);
            setStats(data.stats || null);
            setMlMetrics(data.mlMetrics || null);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setIsReviewing(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setCode(text);
        } catch (err) {
            console.error('Failed to read clipboard');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const languages = [
        'javascript', 'typescript', 'python', 'java', 'go', 'rust',
        'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin'
    ];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Code Review</h1>
                    <p className="text-neutral-400 mt-1">Paste your code below to get instant AI-powered feedback.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm font-medium capitalize"
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    <button
                        onClick={handlePaste}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors text-neutral-300 font-medium text-sm"
                    >
                        <Clipboard size={16} />
                        <span>Paste</span>
                    </button>
                    <button
                        onClick={handleReview}
                        disabled={isReviewing}
                        className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all text-white font-medium text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isReviewing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Start Review</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Split View */}
            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">

                {/* Editor Section */}
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-neutral-800 flex flex-col shadow-2xl">
                    <div className="bg-[#252526] px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></span>
                        </div>
                        <span className="text-xs text-neutral-500 font-mono capitalize">{language}</span>
                    </div>
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: settings.fontSize,
                            lineNumbers: settings.showLineNumbers ? 'on' : 'off',
                            padding: { top: 20 },
                            scrollBeyondLastLine: false,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}
                    />
                </div>

                {/* Results Section */}
                <div className="bg-[#0F0F0F] rounded-xl border border-neutral-800 flex flex-col overflow-hidden">
                    {!isReviewing && reviews.length === 0 && !stats ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-6">
                            <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-2">
                                <FileText size={32} className="text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Ready to Review</h3>
                            <p className="text-neutral-500 max-w-sm">
                                Your code analysis will appear here. We'll check for bugs, security vulnerabilities, and suggest improvements.
                            </p>
                            {settings.enableAI && (
                                <div className="flex items-center gap-2 text-sm text-blue-400">
                                    <Brain size={16} />
                                    ML-powered analysis enabled
                                </div>
                            )}
                        </div>
                    ) : isReviewing ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                            <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                            <div className="h-24 bg-neutral-800 rounded w-full mt-6"></div>
                            <div className="h-24 bg-neutral-800 rounded w-full"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Stats Bar */}
                            {stats && (
                                <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Brain className="text-blue-500" size={20} />
                                            Analysis Results
                                        </h3>
                                        <div className={`px-4 py-2 rounded-lg ${getScoreBg(stats.qualityScore)}/20 border ${getScoreBg(stats.qualityScore)}/30`}>
                                            <span className={`text-2xl font-bold ${getScoreColor(stats.qualityScore)}`}>
                                                {stats.qualityScore}
                                            </span>
                                            <span className="text-neutral-500 text-sm">/100</span>
                                        </div>
                                    </div>

                                    {/* Score Breakdown */}
                                    {stats.readabilityScore !== undefined && (
                                        <div className="grid grid-cols-4 gap-3 mb-4">
                                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                                                <BookOpen size={16} className="mx-auto text-blue-400 mb-1" />
                                                <div className={`text-lg font-bold ${getScoreColor(stats.readabilityScore)}`}>
                                                    {stats.readabilityScore}
                                                </div>
                                                <div className="text-xs text-neutral-500">Readability</div>
                                            </div>
                                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                                                <Zap size={16} className="mx-auto text-yellow-400 mb-1" />
                                                <div className={`text-lg font-bold ${getScoreColor(stats.performanceScore || 0)}`}>
                                                    {stats.performanceScore}
                                                </div>
                                                <div className="text-xs text-neutral-500">Performance</div>
                                            </div>
                                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                                                <Shield size={16} className="mx-auto text-green-400 mb-1" />
                                                <div className={`text-lg font-bold ${getScoreColor(stats.securityScore || 0)}`}>
                                                    {stats.securityScore}
                                                </div>
                                                <div className="text-xs text-neutral-500">Security</div>
                                            </div>
                                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                                                <Bug size={16} className="mx-auto text-red-400 mb-1" />
                                                <div className={`text-lg font-bold ${getScoreColor(100 - (stats.predictedBugRisk || 0))}`}>
                                                    {stats.predictedBugRisk}%
                                                </div>
                                                <div className="text-xs text-neutral-500">Bug Risk</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Issue Summary */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-red-400">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            {stats.highSeverity} high
                                        </span>
                                        <span className="flex items-center gap-1 text-yellow-400">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                            {stats.mediumSeverity} medium
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-400">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            {stats.lowSeverity} low
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="text-center text-green-400 py-8">
                                        <Shield size={32} className="mx-auto mb-2" />
                                        <p>No issues found! Your code looks great.</p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <ReviewCard key={review.id} review={review} />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
