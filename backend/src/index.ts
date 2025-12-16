import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
        uptime: process.uptime()
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
        endpoints: {
            auth: '/api/auth',
            review: '/api/review',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
