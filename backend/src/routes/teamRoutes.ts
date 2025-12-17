import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { Response } from 'express';

const router = Router();

// Get user's teams
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const memberships = await prisma.teamMember.findMany({
            where: { userId },
            include: {
                team: {
                    include: {
                        members: {
                            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
                        },
                        _count: { select: { projects: true } }
                    }
                }
            }
        });

        const teams = memberships.map(m => ({
            ...m.team,
            myRole: m.role,
            memberCount: m.team.members.length,
            projectCount: m.team._count.projects
        }));

        res.json({ teams });
    } catch (error) {
        console.error('Failed to fetch teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Create team
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                members: {
                    create: {
                        userId,
                        role: 'owner'
                    }
                }
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, email: true } } } }
            }
        });

        res.status(201).json({ team });
    } catch (error) {
        console.error('Failed to create team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Add member to team
router.post('/:teamId/members', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { teamId } = req.params;
        const { email, role = 'member' } = req.body;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            return res.status(403).json({ error: 'No permission to add members' });
        }

        // Find user by email
        const userToAdd = await prisma.user.findUnique({ where: { email } });
        if (!userToAdd) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already a member
        const existing = await prisma.teamMember.findFirst({
            where: { teamId, userId: userToAdd.id }
        });

        if (existing) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        const newMember = await prisma.teamMember.create({
            data: {
                teamId,
                userId: userToAdd.id,
                role
            },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        });

        // Create notification for the invited user
        await prisma.notification.create({
            data: {
                userId: userToAdd.id,
                type: 'team_invite',
                title: 'Team Invitation',
                message: `You have been added to team "${(await prisma.team.findUnique({ where: { id: teamId } }))?.name}"`,
                link: `/teams/${teamId}`
            }
        });

        res.status(201).json({ member: newMember });
    } catch (error) {
        console.error('Failed to add member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member from team
router.delete('/:teamId/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { teamId, memberId } = req.params;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            return res.status(403).json({ error: 'No permission to remove members' });
        }

        await prisma.teamMember.delete({
            where: { id: memberId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to remove member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Update team
router.put('/:teamId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { teamId } = req.params;
        const { name, description } = req.body;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            return res.status(403).json({ error: 'No permission to update team' });
        }

        const team = await prisma.team.update({
            where: { id: teamId },
            data: { name, description }
        });

        res.json({ team });
    } catch (error) {
        console.error('Failed to update team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete team
router.delete('/:teamId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { teamId } = req.params;

        // Check if requester is owner
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: 'owner' }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Only owner can delete team' });
        }

        await prisma.team.delete({
            where: { id: teamId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

export default router;
