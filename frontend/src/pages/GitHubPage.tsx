import { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, Link2, Unlink, RefreshCw, Code2, FileCode, Play, X, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Repository {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    url: string;
    private: boolean;
    defaultBranch: string;
    updatedAt: string;
}

interface PullRequest {
    id: number;
    number: number;
    title: string;
    state: string;
    author: string;
    authorAvatar: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    baseBranch: string;
    headBranch: string;
    additions?: number;
    deletions?: number;
    changedFiles?: number;
}

interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

export function GitHubPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();

    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
    const [prFiles, setPrFiles] = useState<PRFile[]>([]);
    const [reviewingFile, setReviewingFile] = useState<PRFile | null>(null);
    const [reviewResult, setReviewResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Check for OAuth callback
        const githubConnected = searchParams.get('github_connected');
        const accessToken = searchParams.get('access_token');
        const githubId = searchParams.get('github_id');
        const githubError = searchParams.get('error');

        if (githubError) {
            setError('Failed to connect to GitHub: ' + githubError);
            // Clear URL params
            window.history.replaceState({}, '', '/github');
        }

        if (githubConnected === 'true' && accessToken && githubId) {
            // Save the token to user account
            saveGitHubToken(accessToken, githubId);
            // Clear URL params
            window.history.replaceState({}, '', '/github');
        }

        if (isAuthenticated) {
            checkConnection();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, searchParams]);

    const saveGitHubToken = async (accessToken: string, githubId: string) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/github/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ accessToken, githubId })
            });

            if (response.ok) {
                setIsConnected(true);
                checkConnection(); // Refresh repos
            } else {
                setError('Failed to save GitHub connection');
            }
        } catch (err) {
            console.error('Failed to save GitHub token:', err);
            setError('Failed to save GitHub connection');
        }
    };


    const checkConnection = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/github/repos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRepos(data.repos || []);
                setIsConnected(true);
            } else if (response.status === 400) {
                setIsConnected(false);
            }
        } catch (err) {
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const connectGitHub = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/github/auth-url`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = data.authUrl;
            } else {
                setError('GitHub OAuth not configured on server');
            }
        } catch (err) {
            setError('Failed to connect to GitHub');
        }
    };

    const disconnectGitHub = async () => {
        if (!confirm('Disconnect GitHub? You will need to reconnect to access repos again.')) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/github/disconnect`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsConnected(false);
            setRepos([]);
            setSelectedRepo(null);
            setPullRequests([]);
        } catch (err) {
            console.error('Failed to disconnect:', err);
        }
    };

    const refreshRepos = async () => {
        setRefreshing(true);
        await checkConnection();
        setRefreshing(false);
    };

    const fetchPullRequests = async (repo: Repository) => {
        setSelectedRepo(repo);
        setPullRequests([]);
        setSelectedPR(null);
        setPrFiles([]);

        try {
            const [owner, repoName] = repo.fullName.split('/');
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/github/repos/${owner}/${repoName}/pulls`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPullRequests(data.pullRequests || []);
            }
        } catch (err) {
            console.error('Failed to fetch PRs:', err);
        }
    };

    const fetchPRFiles = async (pr: PullRequest) => {
        setSelectedPR(pr);
        setPrFiles([]);
        setReviewingFile(null);
        setReviewResult(null);

        try {
            if (!selectedRepo) return;
            const [owner, repoName] = selectedRepo.fullName.split('/');
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/github/repos/${owner}/${repoName}/pulls/${pr.number}/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPrFiles(data.files || []);
            }
        } catch (err) {
            console.error('Failed to fetch PR files:', err);
        }
    };

    const reviewFile = async (file: PRFile) => {
        if (!selectedRepo || !selectedPR) return;

        setReviewingFile(file);
        setReviewResult(null);

        try {
            const [owner, repoName] = selectedRepo.fullName.split('/');
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // First get the file content
            const contentResponse = await fetch(`${apiUrl}/api/github/review-pr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    owner,
                    repo: repoName,
                    pullNumber: selectedPR.number,
                    filePath: file.filename
                })
            });

            if (!contentResponse.ok) throw new Error('Failed to fetch file');

            const fileData = await contentResponse.json();

            // Now run the review
            const reviewResponse = await fetch(`${apiUrl}/api/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: fileData.content,
                    language: getLanguageFromFilename(file.filename),
                    fileName: file.filename,
                    enableML: true,
                    enableAI: true
                })
            });

            if (reviewResponse.ok) {
                const review = await reviewResponse.json();
                setReviewResult(review);
            }
        } catch (err) {
            console.error('Failed to review file:', err);
            setError('Failed to review file');
        }
    };

    const getLanguageFromFilename = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript',
            js: 'javascript', jsx: 'javascript',
            py: 'python', java: 'java', go: 'go',
            rs: 'rust', rb: 'ruby', php: 'php'
        };
        return langMap[ext || ''] || 'plaintext';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'added': return 'text-green-500 bg-green-500/10';
            case 'modified': return 'text-yellow-500 bg-yellow-500/10';
            case 'removed': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <GitBranch size={48} className="text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign in to connect GitHub</h2>
                <p className="text-[var(--text-muted)] mb-4">Review pull requests and integrate with your repositories</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">Sign In</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[var(--accent-blue)]" size={32} />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">GitHub Integration</h1>
                    <p className="text-[var(--text-secondary)]">Connect your repositories and review pull requests</p>
                </div>

                {isConnected ? (
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button onClick={refreshRepos} disabled={refreshing} className="btn btn-secondary">
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button onClick={disconnectGitHub} className="btn btn-danger">
                            <Unlink size={18} /> Disconnect
                        </button>
                    </div>
                ) : (
                    <button onClick={connectGitHub} className="btn btn-primary mt-4 md:mt-0">
                        <Link2 size={18} /> Connect GitHub
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)] flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">×</button>
                </div>
            )}

            {!isConnected ? (
                <div className="card p-12 text-center">
                    <GitBranch size={64} className="mx-auto text-[var(--text-muted)] mb-6" />
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Connect Your GitHub Account</h2>
                    <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                        Connect your GitHub account to access your repositories, review pull requests, and automatically analyze code changes.
                    </p>
                    <button onClick={connectGitHub} className="btn btn-primary">
                        <GitBranch size={18} /> Connect with GitHub
                    </button>
                    <p className="text-xs text-[var(--text-muted)] mt-4">
                        We'll request read access to your repositories and pull requests.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Repositories List */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h3 className="font-semibold text-[var(--text-primary)]">Repositories ({repos.length})</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {repos.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">No repositories found</div>
                            ) : (
                                repos.map(repo => (
                                    <button
                                        key={repo.id}
                                        onClick={() => fetchPullRequests(repo)}
                                        className={`w-full p-4 text-left hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-primary)] ${selectedRepo?.id === repo.id ? 'bg-[var(--accent-blue)]/10 border-l-2 border-l-[var(--accent-blue)]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Code2 size={18} className="text-[var(--text-muted)]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--text-primary)] truncate">{repo.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{repo.language || 'Unknown'}</p>
                                            </div>
                                            {repo.private && <span className="text-xs px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">Private</span>}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pull Requests List */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h3 className="font-semibold text-[var(--text-primary)]">
                                Pull Requests {selectedRepo && `- ${selectedRepo.name}`}
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {!selectedRepo ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">Select a repository</div>
                            ) : pullRequests.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">No open pull requests</div>
                            ) : (
                                pullRequests.map(pr => (
                                    <button
                                        key={pr.id}
                                        onClick={() => fetchPRFiles(pr)}
                                        className={`w-full p-4 text-left hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-primary)] ${selectedPR?.id === pr.id ? 'bg-[var(--accent-blue)]/10' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <GitPullRequest size={18} className="text-green-500 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--text-primary)] line-clamp-2">#{pr.number} {pr.title}</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                                    {pr.headBranch} → {pr.baseBranch}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Files and Review */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h3 className="font-semibold text-[var(--text-primary)]">
                                {selectedPR ? `Files (${prFiles.length})` : 'Changed Files'}
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {!selectedPR ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">Select a pull request</div>
                            ) : prFiles.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">Loading files...</div>
                            ) : (
                                prFiles.map((file, i) => (
                                    <div key={i} className="p-3 border-b border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileCode size={14} className="text-[var(--text-muted)]" />
                                            <span className="text-sm text-[var(--text-primary)] truncate flex-1" title={file.filename}>
                                                {file.filename}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(file.status)}`}>
                                                {file.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                            <span className="text-green-500">+{file.additions}</span>
                                            <span className="text-red-500">-{file.deletions}</span>
                                            <button
                                                onClick={() => reviewFile(file)}
                                                disabled={reviewingFile?.filename === file.filename && !reviewResult}
                                                className="ml-auto flex items-center gap-1 text-[var(--accent-blue)] hover:underline disabled:opacity-50"
                                            >
                                                {reviewingFile?.filename === file.filename && !reviewResult ? (
                                                    <><Loader2 size={12} className="animate-spin" /> Reviewing...</>
                                                ) : (
                                                    <><Play size={12} /> Review</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review Result Modal */}
            {reviewResult && reviewingFile && (
                <div className="modal-overlay" onClick={() => { setReviewResult(null); setReviewingFile(null); }}>
                    <div className="modal max-w-3xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Review: {reviewingFile.filename}</h2>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {reviewResult.stats?.totalIssues || 0} issues found | Quality: {reviewResult.stats?.qualityScore || 0}%
                                </p>
                            </div>
                            <button onClick={() => { setReviewResult(null); setReviewingFile(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body max-h-[60vh] overflow-y-auto">
                            {reviewResult.aiSummary && (
                                <div className="mb-4 p-4 bg-[var(--accent-blue)]/10 rounded-lg">
                                    <p className="text-sm font-medium text-[var(--accent-blue)] mb-1">AI Summary</p>
                                    <p className="text-sm text-[var(--text-primary)]">{reviewResult.aiSummary}</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {reviewResult.reviews?.map((review: any, i: number) => (
                                    <div key={i} className={`p-3 rounded-lg border ${review.severity === 'high' ? 'border-red-500/30 bg-red-500/5' :
                                        review.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                                            'border-blue-500/30 bg-blue-500/5'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${review.severity === 'high' ? 'bg-red-500 text-white' :
                                                review.severity === 'medium' ? 'bg-yellow-500 text-black' :
                                                    'bg-blue-500 text-white'
                                                }`}>
                                                {review.severity}
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">Line {review.line}</span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)]">{review.message}</p>
                                        {review.suggestion && (
                                            <p className="text-xs text-[var(--text-muted)] mt-1">💡 {review.suggestion}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => { setReviewResult(null); setReviewingFile(null); }} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
