import { Router } from 'express';
import { createReview, getHistory, getStats } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public or Protected? Let's make review public but history protected.
// Actually, createReview handles "if userId" logic, so we can use optional auth or just pass public request.
// But authenticateToken will error if no token! We need a "soft" auth or just two routes.
// For now, let's keep review accessible to all, and rely on optional middleware if we had it.
// But authenticateToken is strict.

// Let's create a 'soft' auth middleware or just handle it in controller by checking header manually if needed, 
// OR just separate authorized endpoints.

// Route 1: Public Review (no saving to user history unless token present? tricky with strict middleware)
// Let's use authenticateToken for history. For createReview, let's make it optional.
// I'll rewrite createReview route to use a "tryAuthenticate" middleware if I had one, 
// or just skip middleware for now and handle "User ID from token" inside controller if I parse it manually.
// For simplicity: /review is public. /history is protected.
// If valid token sent to /review, we use it.

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, user: any) => {
            if (!err) {
                (req as any).user = user;
            }
            next();
        });
    } else {
        next();
    }
};

router.post('/', optionalAuth, createReview);
router.get('/history', authenticateToken, getHistory);
router.get('/stats', authenticateToken, getStats);

export default router;
