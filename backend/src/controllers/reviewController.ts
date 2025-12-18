import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { StaticAnalyzer, AnalysisResult } from '../services/analyzer';
import { MLAnalyzer } from '../services/mlAnalyzer';
import { getGeminiAnalyzer } from '../services/geminiAnalyzer';

const staticAnalyzer = new StaticAnalyzer();
const mlAnalyzer = new MLAnalyzer();

interface AuthRequest extends Request {
    user?: { userId: string };
}

export const createReview = async (req: AuthRequest, res: Response) => {
    const { code, language, projectId, fileName, enableML, enableAI, apiKey } = req.body;
    const userId = req.user?.userId;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        // Static analysis (always runs)
        const staticResult: AnalysisResult = staticAnalyzer.analyze(code, language || 'typescript');

        // ML analysis (optional)
        let mlResult = null;
        if (enableML !== false) {
            mlResult = mlAnalyzer.analyze(code, language || 'typescript');
        }

        // Gemini AI analysis (optional - requires API key)
        let geminiResult = null;
        const geminiAnalyzer = getGeminiAnalyzer();

        // Use provided API key or environment variable
        if (apiKey) {
            geminiAnalyzer.setApiKey(apiKey);
        }

        if (enableAI !== false && geminiAnalyzer.isConfigured()) {
            try {
                geminiResult = await geminiAnalyzer.analyze(code, language || 'typescript');
            } catch (aiError) {
                console.error('Gemini AI analysis failed:', aiError);
                // Continue without AI results
            }
        }

        // Combine all results
        const allReviews = [
            ...staticResult.reviews,
            ...(mlResult?.suggestions || []),
            ...(geminiResult?.reviews || []),
        ];

        // Remove duplicates by message similarity
        const uniqueReviews = allReviews.filter((review, index, self) =>
            index === self.findIndex(r =>
                r.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase() ===
                review.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase()
            )
        );

        // Calculate combined stats
        const stats = {
            totalIssues: uniqueReviews.length,
            highSeverity: uniqueReviews.filter(r => r.severity === 'high').length,
            mediumSeverity: uniqueReviews.filter(r => r.severity === 'medium').length,
            lowSeverity: uniqueReviews.filter(r => r.severity === 'low').length,
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
                    content: JSON.stringify(uniqueReviews),
                    codeSnippet: code.substring(0, 500),
                    fullCode: code,
                    language: language || 'typescript',
                    fileName: fileName || 'untitled',
                    linesOfCode: stats.linesOfCode,
                    issueCount: stats.totalIssues,
                    highSeverity: stats.highSeverity,
                    mediumSeverity: stats.mediumSeverity,
                    lowSeverity: stats.lowSeverity,
                    qualityScore: stats.qualityScore,
                    readabilityScore: stats.readabilityScore,
                    maintainabilityScore: stats.maintainabilityScore,
                    securityScore: stats.securityScore,
                    performanceScore: stats.performanceScore,
                    predictedBugRisk: stats.predictedBugRisk,
                    complexity: stats.complexity,
                    projectId: projectId || undefined,
                    userId: userId,
                }
            });
        }

        res.json({
            reviews: uniqueReviews,
            stats,
            mlMetrics: mlResult?.codeMetrics || null,
            patterns: mlResult?.patterns || [],
            aiSummary: geminiResult?.summary || null,
            aiAssessment: geminiResult?.overallAssessment || null,
            suggestedImprovements: geminiResult?.suggestedImprovements || [],
            aiEnabled: geminiAnalyzer.isConfigured(),
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
        // Get all reviews with more fields
        const reviews = await prisma.review.findMany({
            where: { userId },
            select: {
                id: true,
                fileName: true,
                qualityScore: true,
                readabilityScore: true,
                maintainabilityScore: true,
                securityScore: true,
                performanceScore: true,
                issueCount: true,
                highSeverity: true,
                mediumSeverity: true,
                lowSeverity: true,
                linesOfCode: true,
                createdAt: true,
                language: true,
            },
            orderBy: { createdAt: 'desc' },
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

        // Calculate average ML scores
        const avgReadability = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.readabilityScore || 0), 0) / totalReviews
            : 0;
        const avgMaintainability = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.maintainabilityScore || 0), 0) / totalReviews
            : 0;
        const avgSecurity = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.securityScore || 0), 0) / totalReviews
            : 0;
        const avgPerformance = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.performanceScore || 0), 0) / totalReviews
            : 0;

        // Language breakdown
        const languageBreakdown: Record<string, number> = {};
        reviews.forEach((r: any) => {
            languageBreakdown[r.language] = (languageBreakdown[r.language] || 0) + 1;
        });

        // 7-day trend data
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
                issues: dayReviews.reduce((sum: number, r: any) => sum + r.issueCount, 0),
            });
        }

        // Recent reviews (last 5)
        const recentReviewsList = reviews.slice(0, 5).map((r: any) => ({
            id: r.id,
            fileName: r.fileName,
            language: r.language,
            qualityScore: r.qualityScore,
            issueCount: r.issueCount,
            createdAt: r.createdAt,
        }));

        // Improvement score (compare last 7 days to previous 7 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const previousWeek = reviews.filter((r: any) => {
            const date = new Date(r.createdAt);
            return date >= fourteenDaysAgo && date < sevenDaysAgo;
        });
        const currentWeekAvg = recentReviews.length > 0
            ? recentReviews.reduce((sum: number, r: any) => sum + r.qualityScore, 0) / recentReviews.length
            : 0;
        const previousWeekAvg = previousWeek.length > 0
            ? previousWeek.reduce((sum: number, r: any) => sum + r.qualityScore, 0) / previousWeek.length
            : 0;
        const improvementScore = previousWeekAvg > 0
            ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
            : 0;

        res.json({
            // Basic stats
            totalReviews,
            totalIssues,
            totalHigh,
            totalMedium,
            totalLow,
            totalLinesOfCode,
            avgQualityScore: Math.round(avgQualityScore * 10) / 10,

            // ML/AI average scores
            avgScores: {
                quality: Math.round(avgQualityScore * 10) / 10,
                readability: Math.round(avgReadability * 10) / 10,
                maintainability: Math.round(avgMaintainability * 10) / 10,
                security: Math.round(avgSecurity * 10) / 10,
                performance: Math.round(avgPerformance * 10) / 10,
            },

            // Breakdowns
            languageBreakdown,
            trendData,

            // Recent activity
            recentReviews: recentReviewsList,

            // Improvement tracking
            improvementScore: Math.round(improvementScore * 10) / 10,
            thisWeekReviews: recentReviews.length,
            lastWeekReviews: previousWeek.length,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

