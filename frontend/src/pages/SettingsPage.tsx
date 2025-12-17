import { useState, useEffect } from 'react';
import { Settings, Bell, Moon, Sun, Save, RotateCcw, Code2, Check, Key, Palette, Terminal, Webhook, GitBranch, Users, Slack, X, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

type SettingsTab = 'general' | 'appearance' | 'editor' | 'ai' | 'notifications' | 'integrations';

export function SettingsPage() {
    const { settings, updateSettings, resetSettings, saveSettings, isLoading } = useSettings();
    const { theme, setTheme } = useTheme();
    const { isAuthenticated, user } = useAuth();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Local state for form fields
    const [apiKey, setApiKey] = useState(settings.apiKey || '');
    const [fontSize, setFontSize] = useState(settings.fontSize || 14);
    const [slackWebhook, setSlackWebhook] = useState('');
    const [discordWebhook, setDiscordWebhook] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(true);

    useEffect(() => {
        setApiKey(settings.apiKey || '');
        setFontSize(settings.fontSize || 14);
    }, [settings]);

    const handleSave = async () => {
        try {
            updateSettings({
                apiKey,
                fontSize,
                theme: theme as 'dark' | 'light'
            });
            await saveSettings();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Failed to save settings');
        }
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            resetSettings();
            setApiKey('');
            setFontSize(14);
            setTheme('dark');
        }
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <Settings size={18} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
        { id: 'editor', label: 'Editor', icon: <Code2 size={18} /> },
        { id: 'ai', label: 'AI Configuration', icon: <Terminal size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'integrations', label: 'Integrations', icon: <Webhook size={18} /> }
    ];

    const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
        <div className="flex items-start justify-between py-4 border-b border-[var(--border-primary)] last:border-0">
            <div className="flex-1 mr-4">
                <p className="font-medium text-[var(--text-primary)]">{label}</p>
                {description && <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-[var(--accent-blue)]' : 'bg-[var(--bg-tertiary)]'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Settings</h1>
                    <p className="text-[var(--text-secondary)]">Customize your experience</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReset} className="btn btn-ghost">
                        <RotateCcw size={18} /> Reset
                    </button>
                    <button onClick={handleSave} disabled={isLoading} className="btn btn-primary">
                        {saved ? <><Check size={18} /> Saved</> : isLoading ? 'Saving...' : <><Save size={18} /> Save</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)] flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs */}
                <div className="md:w-48 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'bg-[var(--accent-blue)] text-white'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 card p-6">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">General Settings</h2>
                            <SettingRow label="Language" description="Interface language">
                                <select
                                    value={settings.language}
                                    onChange={e => updateSettings({ language: e.target.value })}
                                    className="input py-1.5 w-auto"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Default Programming Language" description="Used when creating new reviews">
                                <select
                                    value={settings.defaultLanguage}
                                    onChange={e => updateSettings({ defaultLanguage: e.target.value })}
                                    className="input py-1.5 w-auto"
                                >
                                    <option value="typescript">TypeScript</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="go">Go</option>
                                    <option value="rust">Rust</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Auto-save" description="Automatically save settings changes">
                                <Toggle enabled={settings.autoSave} onChange={() => updateSettings({ autoSave: !settings.autoSave })} />
                            </SettingRow>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h2>
                            <SettingRow label="Theme" description="Choose your preferred color scheme">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${theme === 'dark' ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-primary)]'
                                            }`}
                                    >
                                        <Moon size={16} /> Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${theme === 'light' ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-primary)]'
                                            }`}
                                    >
                                        <Sun size={16} /> Light
                                    </button>
                                </div>
                            </SettingRow>
                        </div>
                    )}

                    {/* Editor Tab */}
                    {activeTab === 'editor' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Editor Settings</h2>
                            <SettingRow label="Font Size" description="Code editor font size">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        value={fontSize}
                                        onChange={e => setFontSize(parseInt(e.target.value))}
                                        className="w-24"
                                    />
                                    <span className="text-[var(--text-primary)] font-mono w-8">{fontSize}px</span>
                                </div>
                            </SettingRow>
                            <SettingRow label="Line Numbers" description="Show line numbers in editor">
                                <Toggle
                                    enabled={settings.showLineNumbers}
                                    onChange={() => updateSettings({ showLineNumbers: !settings.showLineNumbers })}
                                />
                            </SettingRow>
                        </div>
                    )}

                    {/* AI Tab */}
                    {activeTab === 'ai' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">AI Configuration</h2>
                            <SettingRow label="Enable AI Analysis" description="Use Google Gemini for intelligent code review">
                                <Toggle
                                    enabled={settings.enableAI}
                                    onChange={() => updateSettings({ enableAI: !settings.enableAI })}
                                />
                            </SettingRow>
                            <SettingRow label="Gemini API Key" description="Your Google Gemini API key for AI-powered analysis">
                                <div className="w-full max-w-xs">
                                    <div className="relative">
                                        <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={e => setApiKey(e.target.value)}
                                            placeholder="AIza..."
                                            className="input pl-10 w-full"
                                        />
                                    </div>
                                    <a
                                        href="https://aistudio.google.com/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[var(--accent-blue)] hover:underline mt-1 inline-block"
                                    >
                                        Get your API key from Google AI Studio →
                                    </a>
                                </div>
                            </SettingRow>
                            <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                <h3 className="font-medium text-[var(--text-primary)] mb-2">About AI Analysis</h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    AI analysis uses Google Gemini to provide intelligent code insights including:
                                </p>
                                <ul className="text-sm text-[var(--text-muted)] mt-2 space-y-1">
                                    <li>• Deep code understanding and context-aware suggestions</li>
                                    <li>• Security vulnerability detection</li>
                                    <li>• Performance optimization recommendations</li>
                                    <li>• Best practices and code style improvements</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Notifications</h2>
                            <SettingRow label="In-app Notifications" description="Show notifications in the app">
                                <Toggle
                                    enabled={settings.notifications}
                                    onChange={() => updateSettings({ notifications: !settings.notifications })}
                                />
                            </SettingRow>
                            <SettingRow label="Email Notifications" description="Receive email updates for reviews">
                                <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                            </SettingRow>
                            <h3 className="font-medium text-[var(--text-primary)] mt-6 mb-3">Notification Types</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--accent-blue)]" />
                                    <span className="text-sm text-[var(--text-primary)]">Review completed</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--accent-blue)]" />
                                    <span className="text-sm text-[var(--text-primary)]">Team invitations</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--accent-blue)]" />
                                    <span className="text-sm text-[var(--text-primary)]">Comments on your reviews</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-[var(--accent-blue)]" />
                                    <span className="text-sm text-[var(--text-primary)]">Weekly summary</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Integrations</h2>

                            {/* GitHub */}
                            <div className="p-4 border border-[var(--border-primary)] rounded-lg mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <GitBranch size={24} className="text-[var(--text-primary)]" />
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)]">GitHub</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Review pull requests and integrate with repos</p>
                                    </div>
                                </div>
                                <button onClick={() => window.location.href = '/github'} className="btn btn-secondary text-sm w-full">
                                    Configure GitHub
                                </button>
                            </div>

                            {/* Slack */}
                            <div className="p-4 border border-[var(--border-primary)] rounded-lg mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Slack size={24} className="text-[#4A154B]" />
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)]">Slack</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Get notifications in Slack</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={slackWebhook}
                                    onChange={e => setSlackWebhook(e.target.value)}
                                    placeholder="Webhook URL"
                                    className="input mb-2"
                                />
                                <button className="btn btn-secondary text-sm w-full" disabled={!slackWebhook}>
                                    Save Webhook
                                </button>
                            </div>

                            {/* Discord */}
                            <div className="p-4 border border-[var(--border-primary)] rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-6 h-6 bg-[#5865F2] rounded flex items-center justify-center text-white text-xs font-bold">D</div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)]">Discord</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Get notifications in Discord</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={discordWebhook}
                                    onChange={e => setDiscordWebhook(e.target.value)}
                                    placeholder="Webhook URL"
                                    className="input mb-2"
                                />
                                <button className="btn btn-secondary text-sm w-full" disabled={!discordWebhook}>
                                    Save Webhook
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Section (if authenticated) */}
            {isAuthenticated && user && (
                <div className="card p-6 mt-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <Users size={20} /> Profile
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-2xl font-bold text-white">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-[var(--text-primary)]">{user.name || 'User'}</p>
                            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
