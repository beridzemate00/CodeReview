import React, { useState } from 'react';
import { Settings, Bell, Moon, Sun, Globe, Shield, Save, RotateCcw, Code2, Eye, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings, resetSettings, saveSettings, isLoading } = useSettings();
    const [saved, setSaved] = useState(false);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);

    const handleSave = async () => {
        await saveSettings();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'ka', label: 'Georgian' },
    ];

    const programmingLanguages = [
        'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin'
    ];

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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-neutral-800/50">
                            <div>
                                <p className="text-neutral-200 font-medium">Theme Mode</p>
                                <p className="text-sm text-neutral-500">Select your preferred interface theme</p>
                            </div>
                            <div className="flex bg-neutral-800 rounded-lg p-1">
                                <button
                                    onClick={() => updateSettings({ theme: 'light' })}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                                        }`}
                                >
                                    <Sun size={16} className="inline mr-2" />
                                    Light
                                </button>
                                <button
                                    onClick={() => updateSettings({ theme: 'dark' })}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                                        }`}
                                >
                                    <Moon size={16} className="inline mr-2" />
                                    Dark
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-4 border-b border-neutral-800/50">
                            <div>
                                <p className="text-neutral-200 font-medium">Font Size</p>
                                <p className="text-sm text-neutral-500">Editor font size in pixels</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateSettings({ fontSize: Math.max(10, settings.fontSize - 1) })}
                                    className="w-8 h-8 bg-neutral-800 rounded text-white hover:bg-neutral-700"
                                >-</button>
                                <span className="w-12 text-center text-white font-mono">{settings.fontSize}px</span>
                                <button
                                    onClick={() => updateSettings({ fontSize: Math.min(24, settings.fontSize + 1) })}
                                    className="w-8 h-8 bg-neutral-800 rounded text-white hover:bg-neutral-700"
                                >+</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="text-neutral-200 font-medium">Show Line Numbers</p>
                                <p className="text-sm text-neutral-500">Display line numbers in the code editor</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showLineNumbers}
                                    onChange={(e) => updateSettings({ showLineNumbers: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Code Analysis Settings */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Code2 className="text-green-500" size={20} />
                        Code Analysis
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-neutral-800/50">
                            <div>
                                <p className="text-neutral-200 font-medium">Default Language</p>
                                <p className="text-sm text-neutral-500">Default programming language for analysis</p>
                            </div>
                            <select
                                value={settings.defaultLanguage}
                                onChange={(e) => updateSettings({ defaultLanguage: e.target.value })}
                                className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
                            >
                                {programmingLanguages.map(lang => (
                                    <option key={lang} value={lang} className="capitalize">{lang}</option>
                                ))}
                            </select>
                        </div>

                        <div className="py-4 border-b border-neutral-800/50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-neutral-200 font-medium">Severity Filters</p>
                                    <p className="text-sm text-neutral-500">Which issue severities to show</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {(['high', 'medium', 'low'] as const).map(severity => (
                                    <button
                                        key={severity}
                                        onClick={() => {
                                            const current = settings.severityFilter;
                                            const updated = current.includes(severity)
                                                ? current.filter(s => s !== severity)
                                                : [...current, severity];
                                            updateSettings({ severityFilter: updated });
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${settings.severityFilter.includes(severity)
                                            ? severity === 'high' ? 'bg-red-600 text-white'
                                                : severity === 'medium' ? 'bg-yellow-600 text-white'
                                                    : 'bg-blue-600 text-white'
                                            : 'bg-neutral-800 text-neutral-400'
                                            }`}
                                    >
                                        {severity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="text-neutral-200 font-medium">Enable AI Suggestions</p>
                                <p className="text-sm text-neutral-500">Use ML algorithms for enhanced analysis</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableAI}
                                    onChange={(e) => updateSettings({ enableAI: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Bell className="text-red-500" size={20} />
                        Notifications
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-neutral-800/50">
                            <div>
                                <p className="text-neutral-200 font-medium">Enable Notifications</p>
                                <p className="text-sm text-neutral-500">Receive updates about your code reviews</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={(e) => updateSettings({ notifications: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="text-neutral-200 font-medium">Auto-Save Reviews</p>
                                <p className="text-sm text-neutral-500">Automatically save reviews to history</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSave}
                                    onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* General */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="text-green-500" size={20} />
                        General
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Language</label>
                        <select
                            value={settings.language}
                            onChange={(e) => updateSettings({ language: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            {languages.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Security */}
                <section className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="text-purple-500" size={20} />
                        AI Configuration
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                Gemini API Key
                                {settings.apiKey && <span className="ml-2 text-green-500">✓ Configured</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={apiKeyVisible ? 'text' : 'password'}
                                    value={settings.apiKey}
                                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                                    placeholder="Enter your Gemini API key..."
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 pr-12 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                                />
                                <button
                                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Get your API key from{' '}
                                <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                    Google AI Studio
                                </a>
                                . Your key is stored locally and enables Gemini 2.5 Flash AI-powered code reviews.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                    <button
                        onClick={resetSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw size={18} />
                        Reset to Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {saved ? (
                            <>
                                <Check size={18} />
                                Saved!
                            </>
                        ) : isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
