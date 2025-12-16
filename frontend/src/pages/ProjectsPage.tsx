import React, { useState } from 'react';
import { FolderOpen, Plus, Code2, Calendar, MoreVertical, Search, Grid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
    id: string;
    name: string;
    description: string;
    language: string;
    lastReview: string;
    reviewCount: number;
}

// Mock data for now - will be replaced with API call
const mockProjects: Project[] = [
    {
        id: '1',
        name: 'Frontend Dashboard',
        description: 'React dashboard with TypeScript',
        language: 'typescript',
        lastReview: '2 hours ago',
        reviewCount: 12
    },
    {
        id: '2',
        name: 'API Backend',
        description: 'Express.js REST API',
        language: 'javascript',
        lastReview: '1 day ago',
        reviewCount: 8
    },
    {
        id: '3',
        name: 'Data Pipeline',
        description: 'Python data processing scripts',
        language: 'python',
        lastReview: '3 days ago',
        reviewCount: 5
    },
];

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [projects] = useState<Project[]>(mockProjects);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getLanguageColor = (lang: string) => {
        const colors: Record<string, string> = {
            javascript: 'bg-yellow-500',
            typescript: 'bg-blue-500',
            python: 'bg-green-500',
            java: 'bg-orange-500',
            go: 'bg-cyan-500',
            rust: 'bg-orange-600',
        };
        return colors[lang.toLowerCase()] || 'bg-neutral-500';
    };

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            // TODO: API call to create project
            console.log('Creating project:', newProjectName);
            setShowNewModal(false);
            setNewProjectName('');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <FolderOpen className="text-blue-500" />
                            Projects
                        </h1>
                        <p className="text-neutral-400">Organize your code reviews by project.</p>
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
            </header>

            {/* Search and View Toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex bg-neutral-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-12 text-center">
                    <FolderOpen size={48} className="mx-auto text-neutral-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Projects Yet</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto mb-6">
                        Create a project to organize your code reviews and track progress over time.
                    </p>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Create First Project
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all cursor-pointer group"
                            onClick={() => navigate(`/`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg ${getLanguageColor(project.language)} flex items-center justify-center`}>
                                    <Code2 size={20} className="text-white" />
                                </div>
                                <button className="p-1 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                            <p className="text-sm text-neutral-500 mb-4">{project.description}</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-neutral-500">
                                    <Calendar size={14} />
                                    {project.lastReview}
                                </span>
                                <span className="text-neutral-500">{project.reviewCount} reviews</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 overflow-hidden">
                    {filteredProjects.map((project, i) => (
                        <div
                            key={project.id}
                            className={`flex items-center justify-between p-4 hover:bg-neutral-800/50 cursor-pointer ${i < filteredProjects.length - 1 ? 'border-b border-neutral-800' : ''}`}
                            onClick={() => navigate(`/`)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg ${getLanguageColor(project.language)} flex items-center justify-center`}>
                                    <Code2 size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{project.name}</h3>
                                    <p className="text-sm text-neutral-500">{project.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-neutral-500">
                                <span>{project.reviewCount} reviews</span>
                                <span>{project.lastReview}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Project Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
                        <input
                            type="text"
                            placeholder="Project name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
