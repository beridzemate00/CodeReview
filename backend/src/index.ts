import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('AI Code Review Assistant API is running');
});

interface ReviewRequest {
    code: string;
    language: string;
}

app.post('/api/review', (req: Request, res: Response) => {
    const { code } = req.body;

    // Mock analysis delay
    setTimeout(() => {
        // strict check for empty code
        if (!code || code.trim().length === 0) {
            res.status(400).json({ error: 'Code is required' });
            return;
        }

        const mockReviews = [
            {
                id: '1',
                type: 'bug',
                severity: 'high',
                line: 4,
                message: 'Potential infinite loop',
                suggestion: 'Ensure the loop condition eventually becomes false.',
                rationale: 'If items.length is large or manipulated within the loop, this could cause a freeze.'
            },
            {
                id: '2',
                type: 'performance',
                severity: 'medium',
                line: 2,
                message: 'Use const for variables that are not reassigned',
                suggestion: 'const total = 0;',
                rationale: 'Wait, strictly speaking total IS reassigned. But usually "total" initialization might be better done with reduce.'
            },
            {
                id: '3',
                type: 'refactor',
                severity: 'low',
                line: 3,
                message: 'Prefer Array.reduce for summation',
                suggestion: 'const total = items.reduce((acc, item) => acc + item.price, 0);',
                rationale: 'Functional approach is cleaner and less error-prone than manual loops.'
            }
        ];

        res.json({ reviews: mockReviews });
    }, 1500);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
