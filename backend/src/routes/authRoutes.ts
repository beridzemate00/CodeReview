import { Router } from 'express';
import { register, login, forgotPassword, verifyResetToken, resetPassword, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

export default router;
