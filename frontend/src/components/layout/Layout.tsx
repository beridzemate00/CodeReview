import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search, User, Menu, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (userRef.current && !userRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/notifications?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/history?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'review_completed': return '✅';
            case 'team_invite': return '👥';
            case 'comment': return '💬';
            case 'pr_opened': return '🔀';
            default: return '🔔';
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <header className="h-16 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 md:ml-64">
            <div className="flex items-center text-sm text-[var(--text-secondary)]">
                <button
                    className="md:hidden mr-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu size={24} />
                </button>
                <span className="hidden md:inline hover:text-[var(--text-primary)] cursor-pointer transition-colors">Workspace</span>
                <span className="hidden md:inline mx-2">/</span>
                <span className="text-[var(--text-primary)] font-medium">Code Review</span>
            </div>

            <div className="flex items-center space-x-3 md:space-x-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative group hidden md:block">
                    <Search size={18} className="text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-[var(--text-secondary)] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search reviews..."
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full py-1.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] w-48 focus:w-64 transition-all"
                    />
                </form>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-lg z-50 animate-fadeIn overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
                                <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                                    >
                                        <Check size={12} /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-[var(--text-muted)] text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => {
                                                if (!notif.read) markAsRead(notif.id);
                                                if (notif.link) navigate(notif.link);
                                                setShowNotifications(false);
                                            }}
                                            className={`px-4 py-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors ${!notif.read ? 'bg-[var(--accent-blue)]/5' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notif.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate">{notif.message}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-1">{formatTime(notif.createdAt)}</p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-[var(--border-primary)]">
                                    <button
                                        onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                                        className="w-full py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[var(--accent-blue)]/50 transition-all"
                    >
                        {user?.name ? (
                            <span className="text-white font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <User size={16} className="text-white" />
                        )}
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-lg z-50 animate-fadeIn overflow-hidden">
                            {isAuthenticated && user && (
                                <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                                    <p className="font-medium text-[var(--text-primary)]">{user.name || 'User'}</p>
                                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                                </div>
                            )}
                            <div className="p-2">
                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                                >
                                    Settings
                                </button>
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => { logout(); navigate('/login'); setShowUserMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded-lg transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { navigate('/login'); setShowUserMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 rounded-lg transition-colors"
                                    >
                                        Sign In
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isLoading } = useAuth();

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-3 border-[var(--accent-blue)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[var(--text-muted)]">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)]">
                {children}
            </main>
        </div>
    );
}
