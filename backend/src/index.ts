// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import teamRoutes from './routes/teamRoutes';
import snippetRoutes from './routes/snippetRoutes';
import notificationRoutes from './routes/notificationRoutes';
import githubRoutes from './routes/githubRoutes';
import uploadRoutes from './routes/uploadRoutes';
import exportRoutes from './routes/exportRoutes';
import webhookRoutes from './routes/webhookRoutes';
import { rateLimiters } from './middleware/rateLimiter';
import { aiCache, generalCache } from './services/cacheService';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost', process.env.FRONTEND_URL || ''].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Track connected users
const connectedUsers = new Map<string, { socketId: string; userId?: string; email?: string }>();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    connectedUsers.set(socket.id, { socketId: socket.id });

    // Handle user authentication
    socket.on('authenticate', (data: { userId: string; email: string }) => {
        connectedUsers.set(socket.id, {
            socketId: socket.id,
            userId: data.userId,
            email: data.email
        });
        console.log('User authenticated:', data.email);

        // Broadcast user count
        io.emit('userCount', connectedUsers.size);
    });

    // Handle review started event
    socket.on('reviewStarted', (data: { language: string; linesOfCode: number }) => {
        io.emit('globalActivity', {
            type: 'review_started',
            language: data.language,
            linesOfCode: data.linesOfCode,
            timestamp: new Date().toISOString(),
        });
    });

    // Handle review completed event
    socket.on('reviewCompleted', (data: { language: string; issueCount: number; qualityScore: number }) => {
        io.emit('globalActivity', {
            type: 'review_completed',
            language: data.language,
            issueCount: data.issueCount,
            qualityScore: data.qualityScore,
            timestamp: new Date().toISOString(),
        });
    });

    // Handle settings changed
    socket.on('settingsChanged', (settings: object) => {
        const user = connectedUsers.get(socket.id);
        if (user?.userId) {
            // Broadcast to all user's devices
            socket.broadcast.emit('syncSettings', settings);
        }
    });

    // Handle notification events
    socket.on('newNotification', (data: { userId: string; notification: any }) => {
        // Send to specific user's sockets
        connectedUsers.forEach((user, socketId) => {
            if (user.userId === data.userId) {
                io.to(socketId).emit('notification', data.notification);
            }
        });
    });

    // Handle team updates
    socket.on('teamUpdate', (data: { teamId: string; action: string; payload: any }) => {
        io.emit(`team:${data.teamId}`, { action: data.action, payload: data.payload });
    });

    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        console.log('Client disconnected:', socket.id);
        io.emit('userCount', connectedUsers.size);
    });
});

// Make io available in routes
app.set('io', io);

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:80',
    'http://localhost',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// Parse JSON bodies (with raw body for webhooks)
app.use('/api/webhooks', express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply general rate limiting to all routes
app.use(rateLimiters.general);

// Health check endpoint for Docker
app.get('/health', (req: Request, res: Response) => {
    const cacheStats = {
        ai: aiCache.getStats(),
        general: generalCache.getStats()
    };

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connectedClients: connectedUsers.size,
        cache: cacheStats
    });
});

// Routes with specific rate limits
app.use('/api/auth', rateLimiters.auth, authRoutes);
app.use('/api/review', rateLimiters.review, reviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/upload', rateLimiters.upload, uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'AI Code Review Assistant API',
        version: '2.1.0',
        status: 'running',
        features: {
            websocket: 'Socket.io enabled',
            connectedClients: connectedUsers.size,
            github: 'GitHub integration + webhooks',
            teams: 'Team collaboration',
            snippets: 'Code snippets library',
            upload: 'File upload support',
            notifications: 'Real-time notifications',
            export: 'JSON, HTML, Markdown, CSV exports',
            caching: 'AI response caching',
            rateLimit: 'API rate limiting'
        },
        endpoints: {
            auth: '/api/auth',
            review: '/api/review',
            projects: '/api/projects',
            teams: '/api/teams',
            snippets: '/api/snippets',
            notifications: '/api/notifications',
            github: '/api/github',
            upload: '/api/upload',
            export: '/api/export',
            webhooks: '/api/webhooks',
            health: '/health',
            websocket: 'ws://localhost:' + port,
        }
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

httpServer.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📡 WebSocket server is ready`);
    console.log(`📋 API Version 2.1.0 with enhanced features`);
    console.log(`🔒 Rate limiting enabled`);
    console.log(`💾 Caching enabled`);
});

export { io };
