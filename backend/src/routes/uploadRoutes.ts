import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { StaticAnalyzer } from '../services/analyzer';
import { MLAnalyzer } from '../services/mlAnalyzer';
import { getGeminiAnalyzer } from '../services/geminiAnalyzer';

const router = Router();
const staticAnalyzer = new StaticAnalyzer();
const mlAnalyzer = new MLAnalyzer();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow common code file extensions
        const allowedExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
            '.cpp', '.c', '.h', '.hpp', '.cs', '.rb', '.php', '.swift',
            '.kt', '.scala', '.vue', '.svelte', '.html', '.css', '.scss',
            '.json', '.yaml', '.yml', '.md', '.sql', '.sh', '.bash', '.zip'
        ];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext) || file.mimetype === 'application/zip') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Language detection by extension
const getLanguageFromExtension = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    const languageMap: Record<string, string> = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'cpp',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.rb': 'ruby',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.vue': 'vue',
        '.svelte': 'svelte',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.sql': 'sql',
        '.sh': 'shell',
        '.bash': 'shell'
    };
    return languageMap[ext] || 'plaintext';
};

// Upload single file
router.post('/file', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user?.userId;
        const { projectId, enableML = true, enableAI = true, apiKey } = req.body;

        const filePath = req.file.path;
        const content = fs.readFileSync(filePath, 'utf-8');
        const language = getLanguageFromExtension(req.file.originalname);

        // Run analysis
        const staticResult = staticAnalyzer.analyze(content, language);
        let mlResult = null;
        let geminiResult = null;

        if (enableML !== 'false') {
            mlResult = mlAnalyzer.analyze(content, language);
        }

        const geminiAnalyzer = getGeminiAnalyzer();
        if (apiKey) {
            geminiAnalyzer.setApiKey(apiKey);
        }

        if (enableAI !== 'false' && geminiAnalyzer.isConfigured()) {
            try {
                geminiResult = await geminiAnalyzer.analyze(content, language);
            } catch (aiError) {
                console.error('AI analysis failed:', aiError);
            }
        }

        // Combine results
        const allReviews = [
            ...staticResult.reviews,
            ...(mlResult?.suggestions || []),
            ...(geminiResult?.reviews || [])
        ];

        const uniqueReviews = allReviews.filter((review, index, self) =>
            index === self.findIndex(r =>
                r.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase() ===
                review.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase()
            )
        );

        const stats = {
            totalIssues: uniqueReviews.length,
            highSeverity: uniqueReviews.filter(r => r.severity === 'high').length,
            mediumSeverity: uniqueReviews.filter(r => r.severity === 'medium').length,
            lowSeverity: uniqueReviews.filter(r => r.severity === 'low').length,
            qualityScore: mlResult?.overallScore || staticResult.stats.qualityScore,
            linesOfCode: staticResult.stats.linesOfCode,
            readabilityScore: mlResult?.readabilityScore || 0,
            maintainabilityScore: mlResult?.maintainabilityScore || 0,
            securityScore: mlResult?.securityScore || 0,
            performanceScore: mlResult?.performanceScore || 0,
            predictedBugRisk: mlResult?.predictedBugRisk || 0
        };

        // Save to database if authenticated
        if (userId) {
            await prisma.review.create({
                data: {
                    content: JSON.stringify(uniqueReviews),
                    codeSnippet: content.substring(0, 500),
                    fullCode: content,
                    language,
                    fileName: req.file.originalname,
                    filePath: filePath,
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
                    sourceType: 'upload',
                    projectId: projectId || undefined,
                    userId
                }
            });
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            fileName: req.file.originalname,
            language,
            reviews: uniqueReviews,
            stats,
            mlMetrics: mlResult?.codeMetrics || null,
            patterns: mlResult?.patterns || [],
            aiSummary: geminiResult?.summary || null,
            aiAssessment: geminiResult?.overallAssessment || null,
            suggestedImprovements: geminiResult?.suggestedImprovements || []
        });
    } catch (error) {
        console.error('File upload review failed:', error);
        res.status(500).json({ error: 'Failed to review uploaded file' });
    }
});

// Upload multiple files
router.post('/files', authenticateToken, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const userId = req.user?.userId;
        const { projectId, enableML = true, enableAI = true, apiKey } = req.body;

        interface FileResult {
            fileName: string;
            language?: string;
            stats?: {
                totalIssues: number;
                highSeverity: number;
                mediumSeverity: number;
                lowSeverity: number;
                qualityScore: number;
                linesOfCode: number;
            };
            issueCount?: number;
            reviews?: any[];
            error?: string;
        }
        const results: FileResult[] = [];
        const geminiAnalyzer = getGeminiAnalyzer();
        if (apiKey) {
            geminiAnalyzer.setApiKey(apiKey);
        }

        for (const file of files) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                const language = getLanguageFromExtension(file.originalname);

                // Run analysis
                const staticResult = staticAnalyzer.analyze(content, language);
                let mlResult = null;
                let geminiResult = null;

                if (enableML !== 'false') {
                    mlResult = mlAnalyzer.analyze(content, language);
                }

                if (enableAI !== 'false' && geminiAnalyzer.isConfigured()) {
                    try {
                        geminiResult = await geminiAnalyzer.analyze(content, language);
                    } catch (aiError) {
                        console.error('AI analysis failed for', file.originalname);
                    }
                }

                const allReviews = [
                    ...staticResult.reviews,
                    ...(mlResult?.suggestions || []),
                    ...(geminiResult?.reviews || [])
                ];

                const uniqueReviews = allReviews.filter((review, index, self) =>
                    index === self.findIndex(r =>
                        r.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase() ===
                        review.message.replace('[AI]', '').replace('[ML]', '').trim().toLowerCase()
                    )
                );

                const stats = {
                    totalIssues: uniqueReviews.length,
                    highSeverity: uniqueReviews.filter(r => r.severity === 'high').length,
                    mediumSeverity: uniqueReviews.filter(r => r.severity === 'medium').length,
                    lowSeverity: uniqueReviews.filter(r => r.severity === 'low').length,
                    qualityScore: mlResult?.overallScore || staticResult.stats.qualityScore,
                    linesOfCode: staticResult.stats.linesOfCode
                };

                // Save to database
                if (userId) {
                    await prisma.review.create({
                        data: {
                            content: JSON.stringify(uniqueReviews),
                            codeSnippet: content.substring(0, 500),
                            fullCode: content,
                            language,
                            fileName: file.originalname,
                            linesOfCode: stats.linesOfCode,
                            issueCount: stats.totalIssues,
                            highSeverity: stats.highSeverity,
                            mediumSeverity: stats.mediumSeverity,
                            lowSeverity: stats.lowSeverity,
                            qualityScore: stats.qualityScore,
                            sourceType: 'upload',
                            projectId: projectId || undefined,
                            userId
                        }
                    });
                }

                results.push({
                    fileName: file.originalname,
                    language,
                    stats,
                    issueCount: uniqueReviews.length,
                    reviews: uniqueReviews
                });

                // Clean up
                fs.unlinkSync(file.path);
            } catch (fileError) {
                console.error(`Failed to process ${file.originalname}:`, fileError);
                results.push({
                    fileName: file.originalname,
                    error: 'Failed to process file'
                });
            }
        }

        // Calculate summary
        const summary = {
            totalFiles: files.length,
            successfulReviews: results.filter(r => !r.error).length,
            totalIssues: results.reduce((sum, r) => sum + (r.issueCount || 0), 0),
            avgQualityScore: results.filter(r => r.stats).length > 0
                ? results.reduce((sum, r) => sum + (r.stats?.qualityScore || 0), 0) / results.filter(r => r.stats).length
                : 0
        };

        res.json({ results, summary });
    } catch (error) {
        console.error('Multi-file upload failed:', error);
        res.status(500).json({ error: 'Failed to review uploaded files' });
    }
});

export default router;
