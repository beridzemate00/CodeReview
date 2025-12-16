import React, { useState } from 'react';
import { Settings, Bell, Moon, Sun, Globe, Shield, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('en');
    const [apiKey, setApiKey] = useState('**********************');

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Settings className="text-blue-500" />
                    Settings
                </h1>
                <p className="text-neutral-400">Manage your preferences and application configuration.</p>
            </header>

            <div className="space-y-6">
                {/* Visual Settings */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Sun className="text-yellow-500" size={20} />
                        Appearance
                    </h2>
                    <div className="flex items-center justify-between py-4 border-b border-neutral-800/50">
                        <div>
                            <p className="text-neutral-200 font-medium">Theme Mode</p>
                            <p className="text-sm text-neutral-500">Select your preferred interface theme</p>
                        </div>
                        <div className="flex bg-neutral-800 rounded-lg p-1">
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                                    }`}
                            >
                                <Sun size={16} className="inline mr-2" />
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                                    }`}
                            >
                                <Moon size={16} className="inline mr-2" />
                                Dark
                            </button>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Bell className="text-red-500" size={20} />
                        Notifications
                    </h2>
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-neutral-200 font-medium">Enable Notifications</p>
                            <p className="text-sm text-neutral-500">Receive updates about your code reviews</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => setNotifications(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </section>

                {/* General */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="text-green-500" size={20} />
                        General
                    </h2>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="text-purple-500" size={20} />
                        Security (API Configuration)
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">OpenAI API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                        />
                        <p className="text-xs text-neutral-500 mt-2">Your key is stored locally and never sent to our servers.</p>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
