import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

const router = Router();

// Get user's snippets
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { search, language, tags } = req.query;

        const where: any = { userId };

        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { description: { contains: search as string } },
                { code: { contains: search as string } }
            ];
        }

        if (language) {
            where.language = language;
        }

        const snippets = await prisma.codeSnippet.findMany({
            where,
            orderBy: { updatedAt: 'desc' }
        });

        // Filter by tags if provided
        let result = snippets;
        if (tags) {
            const tagList = (tags as string).split(',');
            result = snippets.filter(s => {
                const snippetTags = s.tags ? JSON.parse(s.tags) : [];
                return tagList.some(t => snippetTags.includes(t));
            });
        }

        res.json({ snippets: result });
    } catch (error) {
        console.error('Failed to fetch snippets:', error);
        res.status(500).json({ error: 'Failed to fetch snippets' });
    }
});

// Get public snippets (library) - no auth required
router.get('/public', async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, language, limit = '20' } = req.query;

        const where: any = { isPublic: true };

        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { description: { contains: search as string } }
            ];
        }

        if (language) {
            where.language = language;
        }

        const snippets = await prisma.codeSnippet.findMany({
            where,
            include: {
                user: { select: { name: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string)
        });

        res.json({ snippets });
    } catch (error) {
        console.error('Failed to fetch public snippets:', error);
        res.status(500).json({ error: 'Failed to fetch public snippets' });
    }
});

// Get single snippet
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const snippet = await prisma.codeSnippet.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { userId: userId || '' },
                    { isPublic: true }
                ]
            },
            include: {
                user: { select: { name: true, avatar: true } }
            }
        });

        if (!snippet) {
            res.status(404).json({ error: 'Snippet not found' });
            return;
        }

        res.json({ snippet });
    } catch (error) {
        console.error('Failed to fetch snippet:', error);
        res.status(500).json({ error: 'Failed to fetch snippet' });
    }
});

// Create snippet
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { title, description, code, language, tags, isPublic } = req.body;

        if (!title || !code) {
            res.status(400).json({ error: 'Title and code are required' });
            return;
        }

        const snippet = await prisma.codeSnippet.create({
            data: {
                title,
                description,
                code,
                language: language || 'typescript',
                tags: tags ? JSON.stringify(tags) : null,
                isPublic: isPublic || false,
                userId
            }
        });

        res.status(201).json({ snippet });
    } catch (error) {
        console.error('Failed to create snippet:', error);
        res.status(500).json({ error: 'Failed to create snippet' });
    }
});

// Update snippet
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { title, description, code, language, tags, isPublic } = req.body;

        const existing = await prisma.codeSnippet.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            res.status(404).json({ error: 'Snippet not found' });
            return;
        }

        const snippet = await prisma.codeSnippet.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                code,
                language,
                tags: tags ? JSON.stringify(tags) : existing.tags,
                isPublic
            }
        });

        res.json({ snippet });
    } catch (error) {
        console.error('Failed to update snippet:', error);
        res.status(500).json({ error: 'Failed to update snippet' });
    }
});

// Delete snippet
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const existing = await prisma.codeSnippet.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            res.status(404).json({ error: 'Snippet not found' });
            return;
        }

        await prisma.codeSnippet.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete snippet:', error);
        res.status(500).json({ error: 'Failed to delete snippet' });
    }
});

export default router;
