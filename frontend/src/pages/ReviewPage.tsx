import { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Clipboard, FileText, Brain, Shield, Zap, BookOpen, Bug, Upload, X, File, Loader2, ChevronDown, Save, Copy, Check } from 'lucide-react';
import { ReviewCard } from '../components/review/ReviewCard';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

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

interface UploadedFile {
    name: string;
    size: number;
    content: string;
    language: string;
}

export function ReviewPage() {
    const { settings } = useSettings();
    const { isAuthenticated } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [code, setCode] = useState('// Paste or type your code here...\n\nfunction example() {\n    console.log("Hello, World!");\n}');
    const [language, setLanguage] = useState(settings.defaultLanguage || 'typescript');
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [suggestedImprovements, setSuggestedImprovements] = useState<string[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedProject] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [enableML, setEnableML] = useState(true);
    const [enableAI, setEnableAI] = useState(settings.enableAI);

    const handleReview = async () => {
        if (!code.trim() || loading) return;

        setLoading(true);
        setReviews([]);
        setStats(null);
        setMlMetrics(null);
        setAiSummary(null);
        setSuggestedImprovements([]);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiUrl}/api/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    code,
                    language,
                    projectId: selectedProject || undefined,
                    enableML,
                    enableAI,
                    apiKey: settings.apiKey || undefined
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Review failed');
            }

            setReviews(data.reviews || []);
            setStats(data.stats);
            setMlMetrics(data.mlMetrics);
            setAiSummary(data.aiSummary);
            setSuggestedImprovements(data.suggestedImprovements || []);
        } catch (error) {
            console.error('Review failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setCode(text);
        } catch (error) {
            console.error('Failed to paste:', error);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        processFiles(files);
    };

    const processFiles = async (files: File[]) => {
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.rb', '.php', '.swift', '.kt', '.cs'];

        const codeFiles = files.filter(f => codeExtensions.some(ext => f.name.endsWith(ext)));

        if (codeFiles.length === 0) {
            alert('Please upload code files');
            return;
        }

        const processed: UploadedFile[] = [];

        for (const file of codeFiles) {
            const content = await file.text();
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const langMap: Record<string, string> = {
                js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
                py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c',
                rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin', cs: 'csharp'
            };

            processed.push({
                name: file.name,
                size: file.size,
                content,
                language: langMap[ext] || 'plaintext'
            });
        }

        setUploadedFiles(processed);

        // If single file, load it into editor
        if (processed.length === 1) {
            setCode(processed[0].content);
            setLanguage(processed[0].language);
            setUploadedFiles([]);
        }
    };

    const handleUploadReview = async () => {
        if (uploadedFiles.length === 0) return;

        setLoading(true);
        setReviews([]);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            const formData = new FormData();
            // Create blobs from file contents
            for (const file of uploadedFiles) {
                const blob = new Blob([file.content], { type: 'text/plain' });
                formData.append('files', blob, file.name);
            }
            formData.append('enableML', String(enableML));
            formData.append('enableAI', String(enableAI));
            if (selectedProject) formData.append('projectId', selectedProject);
            if (settings.apiKey) formData.append('apiKey', settings.apiKey);

            const response = await fetch(`${apiUrl}/api/upload/files`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            // Combine reviews from all files
            const allReviews = data.results?.flatMap((r: any) => r.reviews?.map((rev: any) => ({ ...rev, fileName: r.fileName })) || []) || [];
            setReviews(allReviews);

            if (data.summary) {
                setStats({
                    totalIssues: data.summary.totalIssues,
                    highSeverity: allReviews.filter((r: any) => r.severity === 'high').length,
                    mediumSeverity: allReviews.filter((r: any) => r.severity === 'medium').length,
                    lowSeverity: allReviews.filter((r: any) => r.severity === 'low').length,
                    qualityScore: data.summary.avgQualityScore
                });
            }

            setUploadedFiles([]);
        } catch (error: any) {
            console.error('Upload review failed:', error);
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

    const languages = [
        { value: 'typescript', label: 'TypeScript' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'php', label: 'PHP' },
        { value: 'swift', label: 'Swift' },
        { value: 'kotlin', label: 'Kotlin' }
    ];

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Editor Section */}
                <div className="lg:w-1/2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Code Review</h1>
                        <div className="flex items-center gap-2">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="input py-1.5 px-3 w-auto text-sm"
                            >
                                {languages.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* File Upload Zone */}
                    {uploadedFiles.length === 0 && (
                        <div
                            className={`dropzone ${isDragging ? 'active' : ''}`}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.cpp,.c,.rb,.php,.swift,.kt,.cs"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                            <p className="text-[var(--text-primary)] font-medium">Drop files here or click to upload</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Supports multiple code files</p>
                        </div>
                    )}

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-[var(--text-primary)]">{uploadedFiles.length} files ready for review</h3>
                                <button onClick={() => setUploadedFiles([])} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {uploadedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <File size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[var(--text-primary)] truncate flex-1">{file.name}</span>
                                        <span className="text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)}KB</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleUploadReview}
                                disabled={loading}
                                className="btn btn-primary w-full mt-4"
                            >
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Reviewing...</> : <><Play size={18} /> Review All Files</>}
                            </button>
                        </div>
                    )}

                    {/* Code Editor */}
                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                            <span className="text-sm text-[var(--text-muted)]">Code Editor</span>
                            <div className="flex gap-1">
                                <button onClick={handlePaste} className="btn btn-ghost text-xs py-1 px-2">
                                    <Clipboard size={14} /> Paste
                                </button>
                                <button onClick={handleCopy} className="btn btn-ghost text-xs py-1 px-2">
                                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                        </div>
                        <Editor
                            height="350px"
                            language={language}
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: settings.fontSize || 14,
                                lineNumbers: settings.showLineNumbers ? 'on' : 'off',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                padding: { top: 16 }
                            }}
                        />
                    </div>

                    {/* Advanced Options */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        Advanced Options
                    </button>

                    {showAdvanced && (
                        <div className="card p-4 space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain size={18} className="text-[var(--accent-purple)]" />
                                    <span className="text-sm text-[var(--text-primary)]">ML Analysis</span>
                                </div>
                                <button
                                    onClick={() => setEnableML(!enableML)}
                                    className={`w-10 h-6 rounded-full transition-colors ${enableML ? 'bg-[var(--accent-blue)]' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableML ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap size={18} className="text-[var(--accent-yellow)]" />
                                    <span className="text-sm text-[var(--text-primary)]">AI Analysis (Gemini)</span>
                                </div>
                                <button
                                    onClick={() => setEnableAI(!enableAI)}
                                    className={`w-10 h-6 rounded-full transition-colors ${enableAI ? 'bg-[var(--accent-blue)]' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableAI ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {!settings.apiKey && enableAI && (
                                <p className="text-xs text-[var(--accent-yellow)]">⚠️ Add Gemini API key in Settings for AI analysis</p>
                            )}
                        </div>
                    )}

                    {/* Review Button */}
                    <button
                        onClick={handleReview}
                        disabled={loading || !code.trim()}
                        className="btn btn-primary w-full py-3 text-base"
                    >
                        {loading ? (
                            <><Loader2 size={20} className="animate-spin" /> Analyzing...</>
                        ) : (
                            <><Play size={20} /> Review Code</>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                <div className="lg:w-1/2 space-y-4">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className={`stat-card p-4 ${getScoreBg(stats.qualityScore)}`}>
                                <FileText size={18} className={getScoreColor(stats.qualityScore)} />
                                <p className={`text-2xl font-bold mt-2 ${getScoreColor(stats.qualityScore)}`}>{Math.round(stats.qualityScore)}%</p>
                                <p className="text-xs text-[var(--text-muted)]">Quality</p>
                            </div>
                            <div className="stat-card p-4">
                                <Bug size={18} className="text-[var(--accent-red)]" />
                                <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">{stats.totalIssues}</p>
                                <p className="text-xs text-[var(--text-muted)]">Issues</p>
                            </div>
                            <div className="stat-card p-4">
                                <Shield size={18} className="text-[var(--accent-orange)]" />
                                <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">{stats.highSeverity}</p>
                                <p className="text-xs text-[var(--text-muted)]">High</p>
                            </div>
                            <div className="stat-card p-4">
                                <BookOpen size={18} className="text-[var(--accent-blue)]" />
                                <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">{stats.mediumSeverity + stats.lowSeverity}</p>
                                <p className="text-xs text-[var(--text-muted)]">Suggestions</p>
                            </div>
                        </div>
                    )}

                    {/* ML Metrics */}
                    {mlMetrics && (
                        <div className="card p-4">
                            <h3 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Brain size={18} className="text-[var(--accent-purple)]" /> ML Metrics
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-[var(--text-muted)]">Lines</p>
                                    <p className="font-medium text-[var(--text-primary)]">{mlMetrics.linesOfCode}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--text-muted)]">Functions</p>
                                    <p className="font-medium text-[var(--text-primary)]">{mlMetrics.functionCount}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--text-muted)]">Nesting</p>
                                    <p className="font-medium text-[var(--text-primary)]">{mlMetrics.nestingDepth}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Summary */}
                    {aiSummary && (
                        <div className="card p-4 bg-gradient-to-br from-[var(--accent-blue)]/5 to-[var(--accent-purple)]/5 border-[var(--accent-blue)]/20">
                            <h3 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                <Zap size={18} className="text-[var(--accent-blue)]" /> AI Summary
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">{aiSummary}</p>
                            {suggestedImprovements.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Suggested Improvements:</p>
                                    <ul className="space-y-1">
                                        {suggestedImprovements.slice(0, 3).map((imp, i) => (
                                            <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                                                <span className="text-[var(--accent-blue)]">→</span> {imp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review Results */}
                    <div className="space-y-3">
                        {reviews.length === 0 && !loading && (
                            <div className="card p-8 text-center">
                                <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                                <p className="text-[var(--text-muted)]">Review results will appear here</p>
                            </div>
                        )}

                        {reviews.map((review, index) => (
                            <ReviewCard key={review.id || index} review={review} />
                        ))}
                    </div>

                    {/* Save to Snippets (if authenticated and has code) */}
                    {isAuthenticated && stats && (
                        <button
                            onClick={() => {/* Navigate to snippets with pre-filled data */ }}
                            className="btn btn-secondary w-full"
                        >
                            <Save size={18} /> Save to Snippets
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
