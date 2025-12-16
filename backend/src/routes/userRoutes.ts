import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res) => {
    try {
        // For now, return settings from localStorage on client
        // In production, store in database
        res.json({ message: 'Settings endpoint - use localStorage for now' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update user settings
router.put('/settings', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const settings = req.body;
        // In production, save to database using req.user.userId
        console.log('Settings updated for user:', req.user?.userId);
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
        res.json({
            userId: req.user?.userId,
            message: 'Profile endpoint'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
