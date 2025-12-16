import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
    theme: 'dark' | 'light';
    notifications: boolean;
    language: string;
    apiKey: string;
    autoSave: boolean;
    showLineNumbers: boolean;
    fontSize: number;
    defaultLanguage: string;
    severityFilter: ('high' | 'medium' | 'low')[];
    enableAI: boolean;
}

const defaultSettings: AppSettings = {
    theme: 'dark',
    notifications: true,
    language: 'en',
    apiKey: '',
    autoSave: true,
    showLineNumbers: true,
    fontSize: 14,
    defaultLanguage: 'typescript',
    severityFilter: ['high', 'medium', 'low'],
    enableAI: true,
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
    saveSettings: () => Promise<void>;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = localStorage.getItem('appSettings');
        if (stored) {
            try {
                return { ...defaultSettings, ...JSON.parse(stored) };
            } catch {
                return defaultSettings;
            }
        }
        return defaultSettings;
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Apply theme
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
        document.documentElement.classList.toggle('light', settings.theme === 'light');
    }, [settings.theme]);

    const updateSettings = (updates: Partial<AppSettings>) => {
        setSettings(prev => {
            const newSettings = { ...prev, ...updates };
            localStorage.setItem('appSettings', JSON.stringify(newSettings));
            return newSettings;
        });
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    };

    const saveSettings = async () => {
        setIsLoading(true);
        try {
            // If user is authenticated, sync settings to backend
            const token = localStorage.getItem('token');
            if (token) {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                await fetch(`${apiUrl}/api/user/settings`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(settings),
                });
            }
            localStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, saveSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
