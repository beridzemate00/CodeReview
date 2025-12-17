import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { Response } from 'express';

const router = Router();

// Get user notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { unreadOnly, limit = '50' } = req.query;

        const where: any = { userId };
        if (unreadOnly === 'true') {
            where.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string)
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Send webhook notification (for integrations)
router.post('/webhook', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { webhookUrl, type, payload } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }

        // Send to webhook (Slack/Discord format)
        const webhookPayload = type === 'slack' ? {
            text: payload.title,
            blocks: [
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `*${payload.title}*\n${payload.message}` }
                }
            ]
        } : {
            content: `**${payload.title}**\n${payload.message}`,
            embeds: payload.embeds || []
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
        });

        if (!response.ok) {
            throw new Error('Webhook failed');
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to send webhook:', error);
        res.status(500).json({ error: 'Failed to send webhook notification' });
    }
});

export default router;
