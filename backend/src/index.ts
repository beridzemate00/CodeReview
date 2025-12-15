import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('AI Code Review Assistant API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
