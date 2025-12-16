import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { StaticAnalyzer, AnalysisResult } from '../services/analyzer';
import { MLAnalyzer } from '../services/mlAnalyzer';

const staticAnalyzer = new StaticAnalyzer();
const mlAnalyzer = new MLAnalyzer();

interface AuthRequest extends Request {
    user?: { userId: string };
}

export const createReview = async (req: AuthRequest, res: Response) => {
    const { code, language, projectId, fileName, enableML } = req.body;
    const userId = req.user?.userId;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        // Static analysis
        const staticResult: AnalysisResult = staticAnalyzer.analyze(code, language || 'typescript');

        // ML analysis (optional but enabled by default)
        let mlResult = null;
        if (enableML !== false) {
            mlResult = mlAnalyzer.analyze(code, language || 'typescript');
        }

        // Combine results
        const allReviews = [
            ...staticResult.reviews,
            ...(mlResult?.suggestions || []),
        ];

        // Calculate combined stats
        const stats = {
            totalIssues: allReviews.length,
            highSeverity: allReviews.filter(r => r.severity === 'high').length,
            mediumSeverity: allReviews.filter(r => r.severity === 'medium').length,
            lowSeverity: allReviews.filter(r => r.severity === 'low').length,
            qualityScore: mlResult?.overallScore || staticResult.stats.qualityScore,
            complexity: mlResult?.codeMetrics?.nestingDepth || staticResult.stats.complexity,
            linesOfCode: staticResult.stats.linesOfCode,
            // ML-specific scores
            readabilityScore: mlResult?.readabilityScore || 0,
            maintainabilityScore: mlResult?.maintainabilityScore || 0,
            securityScore: mlResult?.securityScore || 0,
            performanceScore: mlResult?.performanceScore || 0,
            predictedBugRisk: mlResult?.predictedBugRisk || 0,
        };

        // Save to DB if user is authenticated
        if (userId) {
            await prisma.review.create({
                data: {
                    content: JSON.stringify(allReviews),
                    codeSnippet: code.substring(0, 500),
                    language: language || 'typescript',
                    fileName: fileName || 'untitled',
                    linesOfCode: stats.linesOfCode,
                    issueCount: stats.totalIssues,
                    highSeverity: stats.highSeverity,
                    mediumSeverity: stats.mediumSeverity,
                    lowSeverity: stats.lowSeverity,
                    qualityScore: stats.qualityScore,
                    complexity: stats.complexity,
                    projectId: projectId || undefined,
                    userId: userId,
                }
            });
        }

        res.json({
            reviews: allReviews,
            stats,
            mlMetrics: mlResult?.codeMetrics || null,
            patterns: mlResult?.patterns || [],
        });
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
        const reviews = await prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const parsedReviews = reviews.map((review: any) => ({
            ...review,
            content: JSON.parse(review.content || '[]'),
        }));

        res.json({ reviews: parsedReviews });
    } catch (error) {
        console.error('Failed to fetch history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

export const getStats = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { userId },
            select: {
                qualityScore: true,
                issueCount: true,
                highSeverity: true,
                mediumSeverity: true,
                lowSeverity: true,
                linesOfCode: true,
                createdAt: true,
                language: true,
            },
        });

        const totalReviews = reviews.length;
        const totalIssues = reviews.reduce((sum: number, r: any) => sum + r.issueCount, 0);
        const totalHigh = reviews.reduce((sum: number, r: any) => sum + r.highSeverity, 0);
        const totalMedium = reviews.reduce((sum: number, r: any) => sum + r.mediumSeverity, 0);
        const totalLow = reviews.reduce((sum: number, r: any) => sum + r.lowSeverity, 0);
        const totalLinesOfCode = reviews.reduce((sum: number, r: any) => sum + r.linesOfCode, 0);
        const avgQualityScore = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.qualityScore, 0) / totalReviews
            : 0;

        const languageBreakdown: Record<string, number> = {};
        reviews.forEach((r: any) => {
            languageBreakdown[r.language] = (languageBreakdown[r.language] || 0) + 1;
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReviews = reviews.filter((r: any) => new Date(r.createdAt) >= sevenDaysAgo);

        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayReviews = recentReviews.filter((r: any) =>
                new Date(r.createdAt).toISOString().split('T')[0] === dateStr
            );
            trendData.push({
                date: dateStr,
                reviews: dayReviews.length,
                avgScore: dayReviews.length > 0
                    ? dayReviews.reduce((sum: number, r: any) => sum + r.qualityScore, 0) / dayReviews.length
                    : 0,
            });
        }

        res.json({
            totalReviews,
            totalIssues,
            totalHigh,
            totalMedium,
            totalLow,
            totalLinesOfCode,
            avgQualityScore: Math.round(avgQualityScore * 10) / 10,
            languageBreakdown,
            trendData,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
