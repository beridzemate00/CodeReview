import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { Response } from 'express';

const router = Router();

// Get all projects for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { reviews: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const formattedProjects = projects.map(p => ({
            ...p,
            reviewCount: p._count.reviews,
            _count: undefined
        }));

        res.json({ projects: formattedProjects });
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId },
            include: {
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project });
    } catch (error) {
        console.error('Failed to fetch project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create project
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, description, repoUrl, language, githubOwner, githubRepo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                repoUrl,
                language: language || 'typescript',
                githubOwner,
                githubRepo,
                userId
            }
        });

        res.status(201).json({ project });
    } catch (error) {
        console.error('Failed to create project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, description, repoUrl, language, githubOwner, githubRepo, customRules } = req.body;

        const existing = await prisma.project.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                repoUrl,
                language,
                githubOwner,
                githubRepo,
                customRules
            }
        });

        res.json({ project });
    } catch (error) {
        console.error('Failed to update project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const existing = await prisma.project.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await prisma.project.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get project stats
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const reviews = await prisma.review.findMany({
            where: { projectId: req.params.id },
            select: {
                qualityScore: true,
                issueCount: true,
                highSeverity: true,
                mediumSeverity: true,
                lowSeverity: true,
                linesOfCode: true,
                createdAt: true
            }
        });

        const totalReviews = reviews.length;
        const avgQualityScore = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.qualityScore, 0) / totalReviews
            : 0;

        const totalIssues = reviews.reduce((sum, r) => sum + r.issueCount, 0);
        const totalLinesReviewed = reviews.reduce((sum, r) => sum + r.linesOfCode, 0);

        // Trend over time
        const trendData = reviews.slice(-30).map(r => ({
            date: r.createdAt.toISOString().split('T')[0],
            score: r.qualityScore,
            issues: r.issueCount
        }));

        res.json({
            totalReviews,
            avgQualityScore: Math.round(avgQualityScore * 10) / 10,
            totalIssues,
            totalLinesReviewed,
            trendData
        });
    } catch (error) {
        console.error('Failed to fetch project stats:', error);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
});

export default router;
