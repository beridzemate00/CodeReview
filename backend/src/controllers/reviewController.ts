import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { StaticAnalyzer } from '../services/analyzer';

const analyzer = new StaticAnalyzer();

interface AuthRequest extends Request {
    user?: { userId: string };
}

export const createReview = async (req: AuthRequest, res: Response) => {
    const { code, language, projectId } = req.body;
    const userId = req.user?.userId;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const reviews = analyzer.analyze(code, language || 'typescript'); // Reviews are an array of objects

        // Save to DB if user is authenticated
        if (userId) {
            // Ideally verify project ownership if projectId provided, or create default project
            // For simplicity, we just save the review without project linkage if no project provided, 
            // but our schema requires projectId to be optional? Yes.

            await prisma.review.create({
                data: {
                    content: JSON.stringify(reviews),
                    projectId: projectId || undefined, // undefined to skip if null
                    // If we want to link to User directly, we might need to adjust schema or use Project.
                    // Schema: Review -> Project -> User.
                    // So we need a project. If no project, we create a "Default Project" for the user.
                }
            });

            // Note: Current schema requires Project for Review? 
            // model Review { ... project Project? ... } -> It's optional. Good.
        }

        res.json({ reviews });
    } catch (error) {
        console.error('Review failed:', error);
        res.status(500).json({ error: 'Review failed' });
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Find projects for user, then reviews for those projects
        const projects = await prisma.project.findMany({
            where: { userId },
            include: { reviews: { orderBy: { createdAt: 'desc' } } }
        });

        const reviews = projects.flatMap((p: { reviews: any[] }) => p.reviews).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
}
