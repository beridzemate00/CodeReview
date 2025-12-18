import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import prisma from '../prisma/client';
import exportService from '../services/exportService';

const router = Router();

// Get export formats available
router.get('/formats', (req, res) => {
    res.json({
        formats: [
            { id: 'json', name: 'JSON', description: 'Machine-readable format', mimeType: 'application/json' },
            { id: 'html', name: 'HTML/PDF', description: 'Printable report format', mimeType: 'text/html' },
            { id: 'markdown', name: 'Markdown', description: 'Documentation format', mimeType: 'text/markdown' },
            { id: 'csv', name: 'CSV', description: 'Spreadsheet format', mimeType: 'text/csv' }
        ]
    });
});

// Export a single review
router.get('/review/:id', authenticateToken, rateLimiters.general, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { format = 'json', includeCode = 'true', includeSuggestions = 'true' } = req.query;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const review = await prisma.review.findFirst({
            where: { id, userId }
        });

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        // Parse the review content
        let issues = [];
        try {
            const content = JSON.parse(review.content);
            issues = content.reviews || content.issues || [];
        } catch {
            issues = [];
        }

        const reviewData = {
            id: review.id,
            fileName: review.fileName,
            language: review.language,
            code: review.fullCode || review.codeSnippet || '',
            qualityScore: review.qualityScore,
            readabilityScore: review.readabilityScore,
            maintainabilityScore: review.maintainabilityScore,
            securityScore: review.securityScore,
            performanceScore: review.performanceScore,
            issueCount: review.issueCount,
            highSeverity: review.highSeverity,
            mediumSeverity: review.mediumSeverity,
            lowSeverity: review.lowSeverity,
            issues,
            createdAt: review.createdAt.toISOString()
        };

        const options = {
            includeCode: includeCode === 'true',
            includeSuggestions: includeSuggestions === 'true',
            includeMetadata: true
        };

        let content: string;
        let mimeType: string;
        let filename: string;

        switch (format) {
            case 'html':
                content = exportService.toHTML(reviewData, options);
                mimeType = 'text/html';
                filename = `review-${review.id}.html`;
                break;
            case 'markdown':
            case 'md':
                content = exportService.toMarkdown(reviewData, options);
                mimeType = 'text/markdown';
                filename = `review-${review.id}.md`;
                break;
            case 'csv':
                content = exportService.toCSV(reviewData);
                mimeType = 'text/csv';
                filename = `review-${review.id}.csv`;
                break;
            case 'json':
            default:
                content = exportService.toJSON(reviewData, options);
                mimeType = 'application/json';
                filename = `review-${review.id}.json`;
                break;
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ error: 'Failed to export review' });
    }
});

// Export multiple reviews (bulk export)
router.post('/bulk', authenticateToken, rateLimiters.general, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { reviewIds, format = 'json' } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
            res.status(400).json({ error: 'Review IDs are required' });
            return;
        }

        if (reviewIds.length > 50) {
            res.status(400).json({ error: 'Maximum 50 reviews per export' });
            return;
        }

        const reviews = await prisma.review.findMany({
            where: {
                id: { in: reviewIds },
                userId
            },
            orderBy: { createdAt: 'desc' }
        });

        const exportData = reviews.map(review => {
            let issues = [];
            try {
                const content = JSON.parse(review.content);
                issues = content.reviews || content.issues || [];
            } catch {
                issues = [];
            }

            return {
                id: review.id,
                fileName: review.fileName,
                language: review.language,
                qualityScore: review.qualityScore,
                issueCount: review.issueCount,
                highSeverity: review.highSeverity,
                mediumSeverity: review.mediumSeverity,
                lowSeverity: review.lowSeverity,
                createdAt: review.createdAt.toISOString()
            };
        });

        res.json({
            exportedAt: new Date().toISOString(),
            totalReviews: exportData.length,
            reviews: exportData
        });
    } catch (error) {
        console.error('Bulk export failed:', error);
        res.status(500).json({ error: 'Failed to export reviews' });
    }
});

// Export user statistics
router.get('/stats', authenticateToken, rateLimiters.general, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const reviews = await prisma.review.findMany({
            where: { userId },
            select: {
                language: true,
                qualityScore: true,
                issueCount: true,
                highSeverity: true,
                mediumSeverity: true,
                lowSeverity: true,
                linesOfCode: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate statistics
        const totalReviews = reviews.length;
        const totalIssues = reviews.reduce((sum, r) => sum + r.issueCount, 0);
        const totalLines = reviews.reduce((sum, r) => sum + r.linesOfCode, 0);
        const avgQuality = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.qualityScore, 0) / totalReviews
            : 0;

        // Language breakdown
        const languageStats: Record<string, number> = {};
        reviews.forEach(r => {
            languageStats[r.language] = (languageStats[r.language] || 0) + 1;
        });

        // Quality trend over time
        const qualityTrend = reviews.map(r => ({
            date: r.createdAt.toISOString().split('T')[0],
            score: r.qualityScore
        }));

        res.json({
            exportedAt: new Date().toISOString(),
            userId,
            summary: {
                totalReviews,
                totalIssues,
                totalLinesReviewed: totalLines,
                averageQualityScore: Math.round(avgQuality * 100) / 100,
                highSeverityIssues: reviews.reduce((sum, r) => sum + r.highSeverity, 0),
                mediumSeverityIssues: reviews.reduce((sum, r) => sum + r.mediumSeverity, 0),
                lowSeverityIssues: reviews.reduce((sum, r) => sum + r.lowSeverity, 0)
            },
            languageBreakdown: languageStats,
            qualityTrend
        });
    } catch (error) {
        console.error('Stats export failed:', error);
        res.status(500).json({ error: 'Failed to export statistics' });
    }
});

export default router;
