import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search, User, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-neutral-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 md:ml-64">
            <div className="flex items-center text-sm text-neutral-400">
                <button
                    className="md:hidden mr-4 text-neutral-400 hover:text-white"
                    onClick={onMenuClick}
                >
                    <Menu size={24} />
                </button>
                <span className="hidden md:inline hover:text-white cursor-pointer transition-colors">Workspace</span>
                <span className="hidden md:inline mx-2">/</span>
                <span className="text-white font-medium">New Review</span>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
                <div className="relative group hidden md:block">
                    <Search size={18} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-neutral-300 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        className="bg-neutral-900 border border-neutral-800 rounded-full py-1.5 pl-10 pr-4 text-sm text-neutral-300 focus:outline-none focus:border-blue-500.5"
                    />
                </div>

                <button className="relative text-neutral-400 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
                </button>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all">
                    <User size={16} className="text-white" />
                </div>
            </div>
        </header>
    );
}

export function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)]">
                {children}
            </main>
        </div>
    );
}

