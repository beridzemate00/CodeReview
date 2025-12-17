import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import crypto from 'crypto';

const router = Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/github/callback';

// Generate OAuth URL
router.get('/auth-url', authenticateToken, (req: AuthRequest, res: Response): void => {
    if (!GITHUB_CLIENT_ID) {
        res.status(500).json({ error: 'GitHub OAuth not configured on server' });
        return;
    }

    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo,read:user&state=${state}`;

    res.json({ authUrl, state });
});

// OAuth callback
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
    const { code } = req.query;

    if (!code) {
        res.redirect('/github?error=github_auth_failed');
        return;
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT_URI
            })
        });

        const tokenData: any = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error_description || 'Token exchange failed');
        }

        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const githubUser: any = await userResponse.json();
        res.redirect(`/github?github_connected=true&github_user=${githubUser.login}`);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect('/github?error=github_auth_failed');
    }
});

// Connect GitHub to user account
router.post('/connect', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { accessToken, githubId } = req.body;

        await prisma.user.update({
            where: { id: userId },
            data: {
                githubToken: accessToken,
                githubId: githubId?.toString()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to connect GitHub:', error);
        res.status(500).json({ error: 'Failed to connect GitHub' });
    }
});

// Disconnect GitHub
router.delete('/disconnect', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                githubToken: null,
                githubId: null
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to disconnect GitHub:', error);
        res.status(500).json({ error: 'Failed to disconnect GitHub' });
    }
});

// Get user's repositories
router.get('/repos', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user?.githubToken) {
            res.status(400).json({ error: 'GitHub not connected' });
            return;
        }

        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': `Bearer ${user.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos: any[] = await response.json();

        const formattedRepos = repos.map(r => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            language: r.language,
            url: r.html_url,
            private: r.private,
            defaultBranch: r.default_branch,
            updatedAt: r.updated_at
        }));

        res.json({ repos: formattedRepos });
    } catch (error) {
        console.error('Failed to fetch repos:', error);
        res.status(500).json({ error: 'Failed to fetch repositories' });
    }
});

// Get pull requests for a repo
router.get('/repos/:owner/:repo/pulls', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user?.githubToken) {
            res.status(400).json({ error: 'GitHub not connected' });
            return;
        }

        const { owner, repo } = req.params;
        const { state = 'open' } = req.query;

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${user.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch pull requests');
        }

        const pulls: any[] = await response.json();

        const formattedPulls = pulls.map(pr => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user?.login,
            authorAvatar: pr.user?.avatar_url,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            url: pr.html_url,
            baseBranch: pr.base?.ref,
            headBranch: pr.head?.ref
        }));

        res.json({ pullRequests: formattedPulls });
    } catch (error) {
        console.error('Failed to fetch PRs:', error);
        res.status(500).json({ error: 'Failed to fetch pull requests' });
    }
});

// Get PR files
router.get('/repos/:owner/:repo/pulls/:pull_number/files', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user?.githubToken) {
            res.status(400).json({ error: 'GitHub not connected' });
            return;
        }

        const { owner, repo, pull_number } = req.params;

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`,
            {
                headers: {
                    'Authorization': `Bearer ${user.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch PR files');
        }

        const files: any[] = await response.json();

        const formattedFiles = files.map(f => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            patch: f.patch
        }));

        res.json({ files: formattedFiles });
    } catch (error) {
        console.error('Failed to fetch PR files:', error);
        res.status(500).json({ error: 'Failed to fetch PR files' });
    }
});

// Review a PR file
router.post('/review-pr', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user?.githubToken) {
            res.status(400).json({ error: 'GitHub not connected' });
            return;
        }

        const { owner, repo, filePath } = req.body;

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
                headers: {
                    'Authorization': `Bearer ${user.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch file content');
        }

        const fileData: any = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

        res.json({
            content,
            filename: filePath,
            sha: fileData.sha,
            size: fileData.size
        });
    } catch (error) {
        console.error('Failed to get PR file for review:', error);
        res.status(500).json({ error: 'Failed to fetch file for review' });
    }
});

export default router;
