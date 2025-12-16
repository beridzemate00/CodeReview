import React from 'react';
import { LayoutDashboard, Code2, History, FolderOpen, Settings, LogOut, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active
            ? 'bg-blue-600/10 text-blue-500 border-r-2 border-blue-500 rounded-r-none'
            : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100'
            }`}
    >
        <div className={`p-1.5 rounded-md ${active ? 'bg-blue-600/20' : 'group-hover:bg-neutral-700/50'}`}>
            {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
    </button>
);

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`w-64 bg-[#0F0F0F] border-r border-neutral-800 ${isOpen ? 'flex' : 'hidden'} md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-200`}>
                <div className="p-6">
                    <div className="flex items-center space-x-3 text-white mb-8 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg">
                            <Code2 size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                            CodeReview<span className="text-blue-500">.ai</span>
                        </span>
                    </div>

                    <div className="space-y-1">
                        <SidebarItem
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                            onClick={() => navigate('/dashboard')}
                            active={location.pathname === '/dashboard'}
                        />
                        <SidebarItem
                            icon={<Code2 size={18} />}
                            label="Review Code"
                            onClick={() => navigate('/')}
                            active={location.pathname === '/'}
                        />
                        <SidebarItem
                            icon={<History size={18} />}
                            label="History"
                            onClick={() => navigate('/history')}
                            active={location.pathname === '/history'}
                        />
                        <SidebarItem icon={<FolderOpen size={18} />} label="Projects" />
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Settings"
                            onClick={() => navigate('/settings')}
                            active={location.pathname === '/settings'}
                        />
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-neutral-800/50">
                    {isAuthenticated ? (
                        <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} />
                    ) : (
                        <SidebarItem icon={<LogIn size={18} />} label="Sign In" onClick={() => navigate('/login')} active={location.pathname === '/login'} />
                    )}
                </div>
            </aside>
        </>
    );
}
