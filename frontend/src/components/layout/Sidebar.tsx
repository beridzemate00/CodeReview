import React from 'react';
import { LayoutDashboard, Code2, History, FolderOpen, Settings, LogOut } from 'lucide-react';

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

export function Sidebar() {
    return (
        <aside className="w-64 bg-[#0F0F0F] border-r border-neutral-800 flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center space-x-3 text-white mb-8">
                    <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg">
                        <Code2 size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        CodeReview<span className="text-blue-500">.ai</span>
                    </span>
                </div>

                <div className="space-y-1">
                    <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
                    <SidebarItem icon={<Code2 size={18} />} label="Review Code" active />
                    <SidebarItem icon={<History size={18} />} label="History" />
                    <SidebarItem icon={<FolderOpen size={18} />} label="Projects" />
                    <SidebarItem icon={<Settings size={18} />} label="Settings" />
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-neutral-800/50">
                <SidebarItem icon={<LogOut size={18} />} label="Sign Out" />
            </div>
        </aside>
    );
}
