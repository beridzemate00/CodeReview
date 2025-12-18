import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client';
import { StaticAnalyzer } from '../services/analyzer';
import { MLAnalyzer } from '../services/mlAnalyzer';
import { getGeminiAnalyzer } from '../services/geminiAnalyzer';

const router = Router();
const staticAnalyzer = new StaticAnalyzer();
const mlAnalyzer = new MLAnalyzer();

// Verify GitHub webhook signature
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
};

// Get file extension to language mapping
const getLanguageFromFile = (filename: string): string | null => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'py': 'python',
        'java': 'java',
        'go': 'go',
        'rs': 'rust',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'kts': 'kotlin'
    };
    return ext ? langMap[ext] || null : null;
};

// Webhook endpoint for GitHub
router.post('/github', async (req: Request, res: Response): Promise<void> => {
    try {
        const event = req.headers['x-github-event'] as string;
        const delivery = req.headers['x-github-delivery'] as string;
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = req.body;

        console.log(`📥 GitHub webhook received: ${event} (${delivery})`);

        // Handle ping event (for webhook setup verification)
        if (event === 'ping') {
            console.log('✅ Webhook ping received');
            res.status(200).json({ message: 'Pong!', zen: payload.zen });
            return;
        }

        // Only process pull request events
        if (event !== 'pull_request') {
            res.status(200).json({ message: 'Event ignored', event });
            return;
        }

        // Check if this is a PR open/sync event
        const action = payload.action;
        if (!['opened', 'synchronize', 'reopened'].includes(action)) {
            res.status(200).json({ message: 'Action ignored', action });
            return;
        }

        const pr = payload.pull_request;
        const repo = payload.repository;

        console.log(`🔍 Processing PR #${pr.number}: ${pr.title}`);

        // Find project with matching webhook configuration
        const project = await prisma.project.findFirst({
            where: {
                githubOwner: repo.owner.login,
                githubRepo: repo.name,
                webhookSecret: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        githubToken: true,
                        settings: {
                            select: {
                                geminiApiKey: true,
                                enableAI: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            console.log('⚠️ No matching project found for webhook');
            res.status(200).json({ message: 'No matching project configured' });
            return;
        }

        // Verify webhook signature
        if (project.webhookSecret) {
            const rawBody = JSON.stringify(req.body);
            if (!verifyWebhookSignature(rawBody, signature, project.webhookSecret)) {
                console.log('❌ Invalid webhook signature');
                res.status(401).json({ error: 'Invalid signature' });
                return;
            }
        }

        const githubToken = project.user.githubToken;
        if (!githubToken) {
            console.log('⚠️ No GitHub token available for user');
            res.status(200).json({ message: 'GitHub token not configured' });
            return;
        }

        // Fetch PR files
        const filesResponse = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls/${pr.number}/files`,
            {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!filesResponse.ok) {
            throw new Error('Failed to fetch PR files');
        }

        const files: any[] = await filesResponse.json();

        // Filter and review code files
        const reviewComments: any[] = [];
        let totalIssues = 0;

        for (const file of files) {
            const language = getLanguageFromFile(file.filename);
            if (!language || file.status === 'removed') continue;

            // Skip large files
            if (file.changes > 500) {
                console.log(`⏭️ Skipping large file: ${file.filename} (${file.changes} changes)`);
                continue;
            }

            // Fetch file content
            try {
                const contentResponse = await fetch(
                    `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/${file.filename}?ref=${pr.head.sha}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                if (!contentResponse.ok) continue;

                const contentData: any = await contentResponse.json();
                const code = Buffer.from(contentData.content, 'base64').toString('utf-8');

                // Run static analysis
                const staticResult = staticAnalyzer.analyze(code, language);

                // Run ML analysis
                const mlResult = mlAnalyzer.analyze(code, language);

                // Combine issues
                const allIssues = [...staticResult.reviews];
                totalIssues += allIssues.length;

                // Create review comments for each issue
                allIssues.slice(0, 5).forEach(issue => { // Limit to 5 per file
                    if (issue.line && issue.line > 0) {
                        reviewComments.push({
                            path: file.filename,
                            line: issue.line,
                            body: `**${issue.severity.toUpperCase()} - ${issue.type}**: ${issue.message}${issue.suggestion ? `\n\n💡 _Suggestion: ${issue.suggestion}_` : ''}${issue.fixCode ? `\n\n\`\`\`${language}\n${issue.fixCode}\n\`\`\`` : ''}`
                        });
                    }
                });

                console.log(`✅ Analyzed ${file.filename}: ${allIssues.length} issues`);
            } catch (fileError) {
                console.error(`Error analyzing ${file.filename}:`, fileError);
            }
        }

        // Post review to GitHub
        if (reviewComments.length > 0) {
            const reviewBody = `## 🔍 CodeReview.ai - Automated Review

Found **${totalIssues}** issues in this pull request.

---
_This review was automatically generated by [CodeReview.ai](https://codereview.ai)_`;

            try {
                const reviewResponse = await fetch(
                    `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls/${pr.number}/reviews`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            body: reviewBody,
                            event: totalIssues > 0 ? 'COMMENT' : 'APPROVE',
                            comments: reviewComments.slice(0, 20) // GitHub limits to ~20 comments
                        })
                    }
                );

                if (reviewResponse.ok) {
                    console.log(`✅ Posted review to PR #${pr.number}`);
                } else {
                    const error = await reviewResponse.text();
                    console.error('Failed to post review:', error);
                }
            } catch (postError) {
                console.error('Error posting review:', postError);
            }
        }

        // Save review record
        await prisma.review.create({
            data: {
                content: JSON.stringify({ reviews: reviewComments }),
                language: 'multi',
                fileName: `PR #${pr.number}: ${pr.title}`,
                sourceType: 'github_pr',
                pullRequestId: pr.id.toString(),
                pullRequestUrl: pr.html_url,
                commitSha: pr.head.sha,
                issueCount: totalIssues,
                qualityScore: Math.max(0, 100 - totalIssues * 5),
                projectId: project.id,
                userId: project.user.id
            }
        });

        res.status(200).json({
            message: 'PR reviewed successfully',
            pullRequest: pr.number,
            issuesFound: totalIssues,
            commentsPosted: Math.min(reviewComments.length, 20)
        });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Setup webhook for a project
router.post('/setup/:projectId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        // Generate webhook secret
        const webhookSecret = crypto.randomBytes(32).toString('hex');

        const project = await prisma.project.update({
            where: { id: projectId },
            data: { webhookSecret }
        });

        res.json({
            success: true,
            webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhooks/github`,
            webhookSecret,
            instructions: {
                step1: 'Go to your GitHub repository settings',
                step2: 'Navigate to Webhooks > Add webhook',
                step3: 'Set Payload URL to the webhookUrl above',
                step4: 'Set Content type to application/json',
                step5: 'Set Secret to the webhookSecret above',
                step6: 'Select "Pull requests" events',
                step7: 'Save the webhook'
            }
        });
    } catch (error) {
        console.error('Webhook setup error:', error);
        res.status(500).json({ error: 'Failed to setup webhook' });
    }
});

export default router;
