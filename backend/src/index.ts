import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
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

    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        console.log('Client disconnected:', socket.id);
        io.emit('userCount', connectedUsers.size);
    });
});

// Make io available in routes
app.set('io', io);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint for Docker
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connectedClients: connectedUsers.size,
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'AI Code Review Assistant API',
        version: '1.0.0',
        status: 'running',
        features: {
            websocket: 'Socket.io enabled',
            connectedClients: connectedUsers.size,
        },
        endpoints: {
            auth: '/api/auth',
            review: '/api/review',
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
    console.log(`Server is running on port ${port}`);
    console.log(`WebSocket server is ready`);
});

export { io };
