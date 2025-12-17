import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Validate token and get current user
    const validateToken = useCallback(async (savedToken: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${savedToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(savedToken);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            } else {
                // Token is invalid, clear everything
                logout();
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            // On network error, use cached user data
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setToken(savedToken);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        }
    }, [API_URL]);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('token');

            if (savedToken) {
                await validateToken(savedToken);
            }

            setIsLoading(false);
        };

        initAuth();
    }, [validateToken]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshUser = async () => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            await validateToken(savedToken);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated,
            isLoading,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
