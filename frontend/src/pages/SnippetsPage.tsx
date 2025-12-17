import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Tag, Code2, Copy, Check, Trash2, Edit, Globe, Lock, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Editor from '@monaco-editor/react';

interface Snippet {
    id: string;
    title: string;
    description: string | null;
    code: string;
    language: string;
    tags: string | null;
    isPublic: boolean;
    userId: string;
    user?: { name: string | null; avatar: string | null };
    createdAt: string;
    updatedAt: string;
}

export function SnippetsPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [publicSnippets, setPublicSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
    const [searchTerm, setSearchTerm] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null);
    const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        code: '',
        language: 'typescript',
        tags: '',
        isPublic: false
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSnippets();
        }
        fetchPublicSnippets();
    }, [isAuthenticated]);

    const fetchSnippets = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/snippets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSnippets(data.snippets || []);
            }
        } catch (err) {
            console.error('Failed to fetch snippets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicSnippets = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/snippets/public?limit=50`);

            if (response.ok) {
                const data = await response.json();
                setPublicSnippets(data.snippets || []);
            }
        } catch (err) {
            console.error('Failed to fetch public snippets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.code.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/snippets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSnippets(prev => [data.snippet, ...prev]);
                setShowCreateModal(false);
                resetForm();
            }
        } catch (err) {
            console.error('Failed to create snippet:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingSnippet || !formData.title.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/snippets/${editingSnippet.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSnippets(prev => prev.map(s => s.id === editingSnippet.id ? data.snippet : s));
                setEditingSnippet(null);
                resetForm();
            }
        } catch (err) {
            console.error('Failed to update snippet:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this snippet?')) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/snippets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSnippets(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete snippet:', err);
        }
    };

    const copyToClipboard = async (code: string, id: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openEditModal = (snippet: Snippet) => {
        setFormData({
            title: snippet.title,
            description: snippet.description || '',
            code: snippet.code,
            language: snippet.language,
            tags: snippet.tags ? JSON.parse(snippet.tags).join(', ') : '',
            isPublic: snippet.isPublic
        });
        setEditingSnippet(snippet);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            code: '',
            language: 'typescript',
            tags: '',
            isPublic: false
        });
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
            ruby: 'bg-red-500'
        };
        return colors[lang] || 'bg-gray-500';
    };

    const displaySnippets = activeTab === 'my' ? snippets : publicSnippets;
    const filteredSnippets = displaySnippets.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLanguage = !languageFilter || s.language === languageFilter;
        return matchesSearch && matchesLanguage;
    });

    const languages = [...new Set([...snippets, ...publicSnippets].map(s => s.language))];

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Code Snippets</h1>
                    <p className="text-[var(--text-secondary)]">Save and share useful code patterns</p>
                </div>

                {isAuthenticated && (
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4 md:mt-0">
                        <Plus size={18} /> New Snippet
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs w-fit mb-6">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`tab ${activeTab === 'my' ? 'active' : ''}`}
                >
                    My Snippets {snippets.length > 0 && `(${snippets.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('public')}
                    className={`tab ${activeTab === 'public' ? 'active' : ''}`}
                >
                    Public Library {publicSnippets.length > 0 && `(${publicSnippets.length})`}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search snippets..."
                        className="input pl-10"
                    />
                </div>
                <select
                    value={languageFilter}
                    onChange={e => setLanguageFilter(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">All Languages</option>
                    {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>

            {/* Snippets Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-5 w-3/4 rounded mb-3"></div>
                            <div className="skeleton h-24 w-full rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredSnippets.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        {activeTab === 'my' ? 'No snippets yet' : 'No public snippets found'}
                    </h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        {activeTab === 'my' ? 'Save your first code snippet' : 'Try a different search'}
                    </p>
                    {activeTab === 'my' && isAuthenticated && (
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                            <Plus size={18} /> Create Snippet
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSnippets.map(snippet => (
                        <div key={snippet.id} className="card p-6 hover:border-[var(--accent-blue)]/50 group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${getLanguageColor(snippet.language)} flex items-center justify-center`}>
                                        <Code2 size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)]">{snippet.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                            <span className="capitalize">{snippet.language}</span>
                                            {snippet.isPublic ? (
                                                <span className="flex items-center gap-0.5 text-green-500"><Globe size={10} /> Public</span>
                                            ) : (
                                                <span className="flex items-center gap-0.5"><Lock size={10} /> Private</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setViewingSnippet(snippet)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg" title="View">
                                        <Eye size={16} className="text-[var(--text-muted)]" />
                                    </button>
                                    <button onClick={() => copyToClipboard(snippet.code, snippet.id)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg" title="Copy">
                                        {copiedId === snippet.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[var(--text-muted)]" />}
                                    </button>
                                    {snippet.userId === user?.id && (
                                        <>
                                            <button onClick={() => openEditModal(snippet)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg" title="Edit">
                                                <Edit size={16} className="text-[var(--text-muted)]" />
                                            </button>
                                            <button onClick={() => handleDelete(snippet.id)} className="p-1.5 hover:bg-[var(--accent-red)]/10 rounded-lg" title="Delete">
                                                <Trash2 size={16} className="text-[var(--accent-red)]" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {snippet.description && (
                                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{snippet.description}</p>
                            )}

                            {/* Code preview */}
                            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 overflow-hidden">
                                <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto max-h-24">
                                    <code>{snippet.code.substring(0, 300)}{snippet.code.length > 300 ? '...' : ''}</code>
                                </pre>
                            </div>

                            {/* Tags */}
                            {snippet.tags && JSON.parse(snippet.tags).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {JSON.parse(snippet.tags).slice(0, 3).map((tag: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingSnippet) && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingSnippet(null); resetForm(); }}>
                    <div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {editingSnippet ? 'Edit Snippet' : 'Create Snippet'}
                            </h2>
                            <button onClick={() => { setShowCreateModal(false); setEditingSnippet(null); resetForm(); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Snippet title"
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Language</label>
                                    <select value={formData.language} onChange={e => setFormData(p => ({ ...p, language: e.target.value }))} className="input">
                                        <option value="typescript">TypeScript</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="go">Go</option>
                                        <option value="rust">Rust</option>
                                        <option value="cpp">C++</option>
                                        <option value="ruby">Ruby</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Code *</label>
                                <div className="h-48 border border-[var(--border-primary)] rounded-lg overflow-hidden">
                                    <Editor
                                        height="100%"
                                        language={formData.language}
                                        value={formData.code}
                                        onChange={v => setFormData(p => ({ ...p, code: v || '' }))}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                                        placeholder="react, hooks, utility"
                                        className="input"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublic}
                                            onChange={e => setFormData(p => ({ ...p, isPublic: e.target.checked }))}
                                            className="w-4 h-4 accent-[var(--accent-blue)]"
                                        />
                                        <span className="text-sm text-[var(--text-secondary)]">Make public</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => { setShowCreateModal(false); setEditingSnippet(null); resetForm(); }} className="btn btn-secondary">Cancel</button>
                            <button onClick={editingSnippet ? handleUpdate : handleCreate} disabled={!formData.title.trim() || !formData.code.trim() || submitting} className="btn btn-primary">
                                {submitting ? 'Saving...' : editingSnippet ? 'Save Changes' : 'Create Snippet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingSnippet && (
                <div className="modal-overlay" onClick={() => setViewingSnippet(null)}>
                    <div className="modal max-w-3xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{viewingSnippet.title}</h2>
                                <p className="text-sm text-[var(--text-muted)]">{viewingSnippet.language}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(viewingSnippet.code, viewingSnippet.id)} className="btn btn-secondary text-sm">
                                    {copiedId === viewingSnippet.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                </button>
                                <button onClick={() => setViewingSnippet(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="modal-body">
                            {viewingSnippet.description && (
                                <p className="text-[var(--text-secondary)] mb-4">{viewingSnippet.description}</p>
                            )}
                            <div className="h-80 border border-[var(--border-primary)] rounded-lg overflow-hidden">
                                <Editor
                                    height="100%"
                                    language={viewingSnippet.language}
                                    value={viewingSnippet.code}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        lineNumbers: 'on'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
