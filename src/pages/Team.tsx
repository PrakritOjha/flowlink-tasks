import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BoardProvider, useBoard } from '@/hooks/useBoard';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  createBoardInvite,
  deleteBoardInvite,
  removeBoardMember,
} from '@/lib/database/members';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Crown,
  Pencil,
  UserPlus,
  Mail,
  Clock,
  Trash2,
  X,
  Users,
} from 'lucide-react';

const TeamContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentBoard } = useBoard();
  const { members, invites, loading, refresh } = useBoardMembers(currentBoard?.id || null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  const isOwner = currentBoard?.owner_id === user?.id;
  const backUrl = currentBoard ? `/board/${currentBoard.id}` : '/';

  const handleInvite = async () => {
    if (!currentBoard || !inviteEmail.trim()) return;

    setSending(true);
    try {
      await createBoardInvite(currentBoard.id, inviteEmail, 'editor');
      setInviteEmail('');
      refresh();
      toast({ title: 'Invitation sent!' });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: 'User already invited', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to send invitation', variant: 'destructive' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await deleteBoardInvite(inviteId);
      refresh();
      toast({ title: 'Invitation cancelled' });
    } catch {
      toast({ title: 'Failed to cancel invitation', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeBoardMember(memberId);
      refresh();
      toast({ title: 'Member removed' });
    } catch {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const ownerName =
    user?.user_metadata?.display_name || user?.email || 'Owner';
  const ownerInitials =
    user?.user_metadata?.display_name?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'U';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 page-container max-w-2xl mx-auto w-full">
        {/* Back link + title */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={backUrl}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Board</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Invite Section — owner only */}
            {isOwner && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Invite by Email</h2>
                <p className="text-xs text-muted-foreground">
                  They'll sign up with this email and automatically join as an editor.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInvite();
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || sending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {sending ? 'Sending...' : 'Invite'}
                  </Button>
                </div>
              </section>
            )}

            {/* Pending Invites */}
            {invites.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Invitations ({invites.length})
                </h2>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Waiting to sign up
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Board Owner */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Owner</h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    {ownerInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isOwner ? `${ownerName} (You)` : ownerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  Owner
                </Badge>
              </div>
            </section>

            {/* Team Members (Editors) */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Editors ({members.length})
              </h2>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => {
                    const initials =
                      member.profile?.display_name
                        ?.slice(0, 2)
                        .toUpperCase() || 'TM';
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {member.profile?.display_name || 'Team Member'}
                              {member.user_id === user?.id && ' (You)'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Can create and edit tasks
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5 text-green-600" />
                            Editor
                          </Badge>
                          {isOwner && member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                  No team members yet. Invite someone to collaborate!
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamPage = () => {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <BoardProvider boardId={boardId}>
      <TeamContent />
    </BoardProvider>
  );
};

export default TeamPage;
