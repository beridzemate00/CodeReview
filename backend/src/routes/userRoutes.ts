import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

const router = Router();

// Get user settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        let settings = await prisma.userSettings.findUnique({
            where: { userId }
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId,
                    theme: 'dark',
                    notifications: true,
                    emailNotifications: true,
                    autoSave: true,
                    showLineNumbers: true,
                    fontSize: 14,
                    defaultLanguage: 'typescript',
                    severityFilter: '["high","medium","low"]',
                    enableAI: true
                }
            });
        }

        res.json({ settings });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update user settings
router.put('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const {
            theme,
            notifications,
            emailNotifications,
            slackWebhook,
            discordWebhook,
            autoSave,
            showLineNumbers,
            fontSize,
            defaultLanguage,
            severityFilter,
            enableAI,
            geminiApiKey,
            customRules,
            disabledRules
        } = req.body;

        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                theme,
                notifications,
                emailNotifications,
                slackWebhook,
                discordWebhook,
                autoSave,
                showLineNumbers,
                fontSize,
                defaultLanguage,
                severityFilter: typeof severityFilter === 'string' ? severityFilter : JSON.stringify(severityFilter),
                enableAI,
                geminiApiKey,
                customRules: typeof customRules === 'string' ? customRules : JSON.stringify(customRules),
                disabledRules: typeof disabledRules === 'string' ? disabledRules : JSON.stringify(disabledRules)
            },
            create: {
                userId,
                theme: theme || 'dark',
                notifications: notifications ?? true,
                emailNotifications: emailNotifications ?? true,
                slackWebhook,
                discordWebhook,
                autoSave: autoSave ?? true,
                showLineNumbers: showLineNumbers ?? true,
                fontSize: fontSize || 14,
                defaultLanguage: defaultLanguage || 'typescript',
                severityFilter: typeof severityFilter === 'string' ? severityFilter : '["high","medium","low"]',
                enableAI: enableAI ?? true,
                geminiApiKey,
                customRules: typeof customRules === 'string' ? customRules : undefined,
                disabledRules: typeof disabledRules === 'string' ? disabledRules : undefined
            }
        });

        console.log('Settings updated for user:', userId);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Failed to save settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        reviews: true,
                        projects: true,
                        snippets: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { name, avatar },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Failed to update profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
