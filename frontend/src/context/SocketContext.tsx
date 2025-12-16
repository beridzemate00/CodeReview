import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    userCount: number;
    globalActivity: GlobalActivity[];
}

interface GlobalActivity {
    type: 'review_started' | 'review_completed';
    language: string;
    linesOfCode?: number;
    issueCount?: number;
    qualityScore?: number;
    timestamp: string;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    userCount: 0,
    globalActivity: [],
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [globalActivity, setGlobalActivity] = useState<GlobalActivity[]>([]);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const socketInstance = io(apiUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);

            // Authenticate if user is logged in
            if (isAuthenticated && user) {
                socketInstance.emit('authenticate', {
                    userId: user.id,
                    email: user.email,
                });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('userCount', (count: number) => {
            setUserCount(count);
        });

        socketInstance.on('globalActivity', (activity: GlobalActivity) => {
            setGlobalActivity(prev => [activity, ...prev].slice(0, 20));
        });

        socketInstance.on('syncSettings', (settings: object) => {
            // Handle settings sync from other devices
            console.log('Settings synced from another device:', settings);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Re-authenticate when user changes
    useEffect(() => {
        if (socket && isAuthenticated && user) {
            socket.emit('authenticate', {
                userId: user.id,
                email: user.email,
            });
        }
    }, [socket, isAuthenticated, user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, userCount, globalActivity }}>
            {children}
        </SocketContext.Provider>
    );
};
