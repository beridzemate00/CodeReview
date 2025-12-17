import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

const router = Router();

// Get user's teams
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

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

// Get single team
router.get('/:teamId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId } = req.params;

        // Check if user is a member
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId }
        });

        if (!membership) {
            res.status(403).json({ error: 'Not a member of this team' });
            return;
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
                },
                projects: true,
                _count: { select: { projects: true } }
            }
        });

        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        res.json({ team, myRole: membership.role });
    } catch (error) {
        console.error('Failed to fetch team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Create team
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Team name is required' });
            return;
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

// Get team members
router.get('/:teamId/members', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId } = req.params;

        // Check if user is a member
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId }
        });

        if (!membership) {
            res.status(403).json({ error: 'Not a member of this team' });
            return;
        }

        const members = await prisma.teamMember.findMany({
            where: { teamId },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ members });
    } catch (error) {
        console.error('Failed to fetch team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Add member to team
router.post('/:teamId/members', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId } = req.params;
        const { email, role = 'member' } = req.body;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            res.status(403).json({ error: 'No permission to add members' });
            return;
        }

        // Find user by email
        const userToAdd = await prisma.user.findUnique({ where: { email } });
        if (!userToAdd) {
            res.status(404).json({ error: 'User not found with this email' });
            return;
        }

        // Check if already a member
        const existing = await prisma.teamMember.findFirst({
            where: { teamId, userId: userToAdd.id }
        });

        if (existing) {
            res.status(400).json({ error: 'User is already a member of this team' });
            return;
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
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        await prisma.notification.create({
            data: {
                userId: userToAdd.id,
                type: 'team_invite',
                title: 'Team Invitation',
                message: `You have been added to team "${team?.name || 'Unknown'}"`,
                link: `/teams`
            }
        });

        res.status(201).json({ member: newMember });
    } catch (error) {
        console.error('Failed to add member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member from team
router.delete('/:teamId/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId, memberId } = req.params;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            res.status(403).json({ error: 'No permission to remove members' });
            return;
        }

        // Check if member exists
        const memberToRemove = await prisma.teamMember.findUnique({
            where: { id: memberId }
        });

        if (!memberToRemove || memberToRemove.teamId !== teamId) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }

        // Prevent removing owner
        if (memberToRemove.role === 'owner') {
            res.status(400).json({ error: 'Cannot remove team owner' });
            return;
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

// Update member role
router.put('/:teamId/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId, memberId } = req.params;
        const { role } = req.body;

        // Check if requester is owner
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: 'owner' }
        });

        if (!membership) {
            res.status(403).json({ error: 'Only owner can change roles' });
            return;
        }

        const updatedMember = await prisma.teamMember.update({
            where: { id: memberId },
            data: { role },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        });

        res.json({ member: updatedMember });
    } catch (error) {
        console.error('Failed to update member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Update team
router.put('/:teamId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId } = req.params;
        const { name, description } = req.body;

        // Check if requester has permission
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: { in: ['owner', 'admin'] } }
        });

        if (!membership) {
            res.status(403).json({ error: 'No permission to update team' });
            return;
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
router.delete('/:teamId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { teamId } = req.params;

        // Check if requester is owner
        const membership = await prisma.teamMember.findFirst({
            where: { teamId, userId, role: 'owner' }
        });

        if (!membership) {
            res.status(403).json({ error: 'Only owner can delete team' });
            return;
        }

        // Delete all members first (due to foreign key constraints)
        await prisma.teamMember.deleteMany({
            where: { teamId }
        });

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
