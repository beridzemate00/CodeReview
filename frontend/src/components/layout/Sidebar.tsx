import React from 'react';
import { LayoutDashboard, Code2, History, FolderOpen, Settings, LogOut, LogIn, Users, BookOpen, GitBranch, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${active
            ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-r-2 border-[var(--accent-blue)] rounded-r-none'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
    >
        <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded-md ${active ? 'bg-[var(--accent-blue)]/20' : 'group-hover:bg-[var(--bg-tertiary)]'}`}>
                {icon}
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
            <span className="bg-[var(--accent-red)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {badge > 99 ? '99+' : badge}
            </span>
        )}
    </button>
);

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {title}
        </h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose?.();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] ${isOpen ? 'flex' : 'hidden'} md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-200`}>
                {/* Logo */}
                <div className="p-6">
                    <div className="flex items-center space-x-3 text-[var(--text-primary)] mb-8 cursor-pointer group" onClick={() => handleNavigation('/')}>
                        <div className="bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-[var(--accent-blue)]/30 transition-all">
                            <Code2 size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">CodeReview</span>
                            <span className="text-[var(--accent-blue)]">.ai</span>
                        </span>
                    </div>

                    {/* Main Navigation */}
                    <SidebarSection title="Main">
                        <SidebarItem
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                            onClick={() => handleNavigation('/dashboard')}
                            active={location.pathname === '/dashboard'}
                        />
                        <SidebarItem
                            icon={<Code2 size={18} />}
                            label="Review Code"
                            onClick={() => handleNavigation('/')}
                            active={location.pathname === '/'}
                        />
                        <SidebarItem
                            icon={<History size={18} />}
                            label="History"
                            onClick={() => handleNavigation('/history')}
                            active={location.pathname === '/history'}
                        />
                    </SidebarSection>

                    {/* Resources */}
                    <SidebarSection title="Resources">
                        <SidebarItem
                            icon={<FolderOpen size={18} />}
                            label="Projects"
                            onClick={() => handleNavigation('/projects')}
                            active={location.pathname === '/projects'}
                        />
                        <SidebarItem
                            icon={<BookOpen size={18} />}
                            label="Snippets"
                            onClick={() => handleNavigation('/snippets')}
                            active={location.pathname === '/snippets'}
                        />
                        <SidebarItem
                            icon={<GitBranch size={18} />}
                            label="GitHub"
                            onClick={() => handleNavigation('/github')}
                            active={location.pathname === '/github'}
                        />
                    </SidebarSection>

                    {/* Team */}
                    <SidebarSection title="Collaboration">
                        <SidebarItem
                            icon={<Users size={18} />}
                            label="Teams"
                            onClick={() => handleNavigation('/teams')}
                            active={location.pathname === '/teams'}
                        />
                    </SidebarSection>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto p-6 border-t border-[var(--border-primary)]/50">
                    <SidebarItem
                        icon={<Settings size={18} />}
                        label="Settings"
                        onClick={() => handleNavigation('/settings')}
                        active={location.pathname === '/settings'}
                    />

                    {isAuthenticated ? (
                        <>
                            <div className="mt-4 px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                            </div>
                            <div className="mt-2">
                                <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} />
                            </div>
                        </>
                    ) : (
                        <div className="mt-2">
                            <SidebarItem
                                icon={<LogIn size={18} />}
                                label="Sign In"
                                onClick={() => handleNavigation('/login')}
                                active={location.pathname === '/login'}
                            />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
