import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Code2, Calendar, Search, Grid, List, Trash2, Edit, BarChart3, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Project {
    id: string;
    name: string;
    description: string | null;
    language: string;
    repoUrl: string | null;
    githubOwner: string | null;
    githubRepo: string | null;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
}

interface ProjectStats {
    totalReviews: number;
    avgQualityScore: number;
    totalIssues: number;
    totalLinesReviewed: number;
}

export function ProjectsPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [showStatsModal, setShowStatsModal] = useState<{ project: Project; stats: ProjectStats } | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        language: 'typescript',
        repoUrl: '',
        githubOwner: '',
        githubRepo: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);
            } else {
                throw new Error('Failed to fetch projects');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectStats = async (project: Project) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/projects/${project.id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const stats = await response.json();
                setShowStatsModal({ project, stats });
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleCreateProject = async () => {
        if (!formData.name.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(prev => [data.project, ...prev]);
                setShowCreateModal(false);
                resetForm();
            } else {
                throw new Error('Failed to create project');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProject = async () => {
        if (!editingProject || !formData.name.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...data.project } : p));
                setEditingProject(null);
                resetForm();
            } else {
                throw new Error('Failed to update project');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setProjects(prev => prev.filter(p => p.id !== id));
                setShowDeleteModal(null);
            }
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            language: 'typescript',
            repoUrl: '',
            githubOwner: '',
            githubRepo: ''
        });
    };

    const openEditModal = (project: Project) => {
        setFormData({
            name: project.name,
            description: project.description || '',
            language: project.language,
            repoUrl: project.repoUrl || '',
            githubOwner: project.githubOwner || '',
            githubRepo: project.githubRepo || ''
        });
        setEditingProject(project);
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
            csharp: 'bg-green-600',
            ruby: 'bg-red-500',
            php: 'bg-indigo-500'
        };
        return colors[lang] || 'bg-gray-500';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FolderOpen size={48} className="text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign in to manage projects</h2>
                <p className="text-[var(--text-muted)] mb-4">Create and organize your code review projects</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">
                    Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Projects</h1>
                    <p className="text-[var(--text-secondary)]">Organize your code reviews by project</p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary mt-4 md:mt-0"
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search projects..."
                        className="input pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)]">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-3/4 rounded mb-3"></div>
                            <div className="skeleton h-4 w-full rounded mb-2"></div>
                            <div className="skeleton h-4 w-2/3 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        {searchTerm ? 'No projects found' : 'No projects yet'}
                    </h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        {searchTerm ? 'Try a different search term' : 'Create your first project to get started'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                            <Plus size={18} /> Create Project
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="card p-6 hover:border-[var(--accent-blue)]/50 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${getLanguageColor(project.language)} flex items-center justify-center`}>
                                        <Code2 size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-[var(--text-muted)] capitalize">{project.language}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => fetchProjectStats(project)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg" title="View Stats">
                                        <BarChart3 size={16} className="text-[var(--text-muted)]" />
                                    </button>
                                    <button onClick={() => openEditModal(project)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg" title="Edit">
                                        <Edit size={16} className="text-[var(--text-muted)]" />
                                    </button>
                                    <button onClick={() => setShowDeleteModal(project.id)} className="p-1.5 hover:bg-[var(--accent-red)]/10 rounded-lg" title="Delete">
                                        <Trash2 size={16} className="text-[var(--accent-red)]" />
                                    </button>
                                </div>
                            </div>

                            {project.description && (
                                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                                    {project.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                <div className="flex items-center gap-1">
                                    <Code2 size={14} />
                                    <span>{project.reviewCount} reviews</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>{formatDate(project.updatedAt)}</span>
                                </div>
                            </div>

                            {project.repoUrl && (
                                <a
                                    href={project.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline"
                                >
                                    <ExternalLink size={12} /> View Repository
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="card p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg ${getLanguageColor(project.language)} flex items-center justify-center`}>
                                    <Code2 size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--text-primary)]">{project.name}</h3>
                                    <p className="text-sm text-[var(--text-muted)]">{project.description || 'No description'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{project.reviewCount} reviews</p>
                                    <p className="text-xs text-[var(--text-muted)]">{formatDate(project.updatedAt)}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => fetchProjectStats(project)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg">
                                        <BarChart3 size={18} className="text-[var(--text-muted)]" />
                                    </button>
                                    <button onClick={() => openEditModal(project)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg">
                                        <Edit size={18} className="text-[var(--text-muted)]" />
                                    </button>
                                    <button onClick={() => setShowDeleteModal(project.id)} className="p-2 hover:bg-[var(--accent-red)]/10 rounded-lg">
                                        <Trash2 size={18} className="text-[var(--accent-red)]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingProject) && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {editingProject ? 'Edit Project' : 'Create New Project'}
                            </h2>
                            <button onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Awesome Project"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of your project..."
                                    rows={3}
                                    className="input resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Language</label>
                                <select
                                    value={formData.language}
                                    onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                    className="input"
                                >
                                    <option value="typescript">TypeScript</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="go">Go</option>
                                    <option value="rust">Rust</option>
                                    <option value="cpp">C++</option>
                                    <option value="csharp">C#</option>
                                    <option value="ruby">Ruby</option>
                                    <option value="php">PHP</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Repository URL (optional)</label>
                                <input
                                    type="url"
                                    value={formData.repoUrl}
                                    onChange={e => setFormData(prev => ({ ...prev, repoUrl: e.target.value }))}
                                    placeholder="https://github.com/user/repo"
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={editingProject ? handleUpdateProject : handleCreateProject}
                                disabled={!formData.name.trim() || submitting}
                                className="btn btn-primary"
                            >
                                {submitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete Project</h2>
                            <button onClick={() => setShowDeleteModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-[var(--text-secondary)]">
                                Are you sure you want to delete this project? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowDeleteModal(null)} className="btn btn-secondary">Cancel</button>
                            <button onClick={() => handleDeleteProject(showDeleteModal)} className="btn btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {showStatsModal && (
                <div className="modal-overlay" onClick={() => setShowStatsModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{showStatsModal.project.name} - Statistics</h2>
                            <button onClick={() => setShowStatsModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="stat-card p-4">
                                    <p className="text-sm text-[var(--text-muted)]">Total Reviews</p>
                                    <p className="text-2xl font-bold text-[var(--text-primary)]">{showStatsModal.stats.totalReviews}</p>
                                </div>
                                <div className="stat-card p-4">
                                    <p className="text-sm text-[var(--text-muted)]">Avg Quality</p>
                                    <p className="text-2xl font-bold text-[var(--accent-green)]">{showStatsModal.stats.avgQualityScore}%</p>
                                </div>
                                <div className="stat-card p-4">
                                    <p className="text-sm text-[var(--text-muted)]">Issues Found</p>
                                    <p className="text-2xl font-bold text-[var(--accent-orange)]">{showStatsModal.stats.totalIssues}</p>
                                </div>
                                <div className="stat-card p-4">
                                    <p className="text-sm text-[var(--text-muted)]">Lines Reviewed</p>
                                    <p className="text-2xl font-bold text-[var(--text-primary)]">{showStatsModal.stats.totalLinesReviewed.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowStatsModal(null)} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
