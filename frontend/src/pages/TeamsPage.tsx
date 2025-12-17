import { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, X, Crown, Shield, User, Trash2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TeamMember {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    };
}

interface Team {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    members: TeamMember[];
    memberCount: number;
    projectCount: number;
    myRole: string;
    createdAt: string;
}

export function TeamsPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState<Team | null>(null);
    const [showInviteModal, setShowInviteModal] = useState<string | null>(null);

    // Form states
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchTeams();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: teamName, description: teamDescription })
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(prev => [{ ...data.team, myRole: 'owner', memberCount: 1, projectCount: 0 }, ...prev]);
                setShowCreateModal(false);
                setTeamName('');
                setTeamDescription('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteMember = async (teamId: string) => {
        if (!inviteEmail.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });

            if (response.ok) {
                setShowInviteModal(null);
                setInviteEmail('');
                setInviteRole('member');
                fetchTeams(); // Refresh to get updated member list
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to invite member');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = async (teamId: string, memberId: string) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/teams/${teamId}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTeams();
        } catch (err) {
            console.error('Failed to remove member:', err);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/api/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTeams(prev => prev.filter(t => t.id !== teamId));
        } catch (err) {
            console.error('Failed to delete team:', err);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown size={14} className="text-yellow-500" />;
            case 'admin': return <Shield size={14} className="text-blue-500" />;
            default: return <User size={14} className="text-gray-500" />;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-yellow-500/10 text-yellow-500';
            case 'admin': return 'bg-blue-500/10 text-blue-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Users size={48} className="text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign in to access teams</h2>
                <p className="text-[var(--text-muted)] mb-4">Collaborate with your team on code reviews</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">Sign In</button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Teams</h1>
                    <p className="text-[var(--text-secondary)]">Collaborate with others on code reviews</p>
                </div>

                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4 md:mt-0">
                    <Plus size={18} /> Create Team
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)]">
                    {error}
                    <button onClick={() => setError('')} className="ml-2">×</button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-3/4 rounded mb-3"></div>
                            <div className="skeleton h-4 w-full rounded mb-2"></div>
                            <div className="skeleton h-4 w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No teams yet</h3>
                    <p className="text-[var(--text-muted)] mb-4">Create a team to start collaborating</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus size={18} /> Create Your First Team
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <div key={team.id} className="card p-6 hover:border-[var(--accent-blue)]/50">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
                                        <Users size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)]">{team.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(team.myRole)}`}>
                                            {team.myRole}
                                        </span>
                                    </div>
                                </div>
                                {team.myRole === 'owner' && (
                                    <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 hover:bg-[var(--accent-red)]/10 rounded-lg">
                                        <Trash2 size={16} className="text-[var(--accent-red)]" />
                                    </button>
                                )}
                            </div>

                            {team.description && (
                                <p className="text-sm text-[var(--text-secondary)] mb-4">{team.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
                                <span>{team.memberCount} members</span>
                                <span>•</span>
                                <span>{team.projectCount} projects</span>
                            </div>

                            {/* Member avatars */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex -space-x-2">
                                    {team.members?.slice(0, 4).map(member => (
                                        <div
                                            key={member.id}
                                            className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--bg-card)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]"
                                            title={member.user.name || member.user.email}
                                        >
                                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {team.memberCount > 4 && (
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--bg-card)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                                            +{team.memberCount - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setShowMembersModal(team)} className="flex-1 btn btn-secondary text-sm">
                                    View Members
                                </button>
                                {['owner', 'admin'].includes(team.myRole) && (
                                    <button onClick={() => setShowInviteModal(team.id)} className="btn btn-primary text-sm">
                                        <UserPlus size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Team</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Name *</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    placeholder="Engineering Team"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                <textarea
                                    value={teamDescription}
                                    onChange={e => setTeamDescription(e.target.value)}
                                    placeholder="What does this team work on?"
                                    rows={3}
                                    className="input resize-none"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleCreateTeam} disabled={!teamName.trim() || submitting} className="btn btn-primary">
                                {submitting ? 'Creating...' : 'Create Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Modal */}
            {showMembersModal && (
                <div className="modal-overlay" onClick={() => setShowMembersModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{showMembersModal.name} - Members</h2>
                            <button onClick={() => setShowMembersModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="space-y-3">
                                {showMembersModal.members?.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-sm font-medium">
                                                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--text-primary)]">{member.user.name || 'Unnamed'}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getRoleBadgeClass(member.role)}`}>
                                                {getRoleIcon(member.role)}
                                                {member.role}
                                            </span>
                                            {showMembersModal.myRole === 'owner' && member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleRemoveMember(showMembersModal.id, member.id)}
                                                    className="p-1 hover:bg-[var(--accent-red)]/10 rounded"
                                                >
                                                    <Trash2 size={14} className="text-[var(--accent-red)]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowMembersModal(null)} className="btn btn-secondary">Close</button>
                            {['owner', 'admin'].includes(showMembersModal.myRole) && (
                                <button onClick={() => { setShowInviteModal(showMembersModal.id); setShowMembersModal(null); }} className="btn btn-primary">
                                    <UserPlus size={16} /> Add Member
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invite Member</h2>
                            <button onClick={() => setShowInviteModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address *</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="teammate@example.com"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
                                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input">
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowInviteModal(null)} className="btn btn-secondary">Cancel</button>
                            <button onClick={() => handleInviteMember(showInviteModal)} disabled={!inviteEmail.trim() || submitting} className="btn btn-primary">
                                {submitting ? 'Inviting...' : 'Send Invite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
