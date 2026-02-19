import { useState } from 'react';
import { DbBoard } from '@/lib/database';
import {
  createBoardInvite,
  deleteBoardInvite,
  removeBoardMember,
} from '@/lib/database/members';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Mail,
  Crown,
  Pencil,
  X,
  UserPlus,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: DbBoard | null;
}

export const TeamManagementModal = ({ open, onOpenChange, board }: TeamManagementModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { members, invites, loading, refresh } = useBoardMembers(board?.id || null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  const isOwner = board?.owner_id === user?.id;

  const handleInvite = async () => {
    if (!board || !inviteEmail.trim()) return;

    setSending(true);
    try {
      await createBoardInvite(board.id, inviteEmail, 'editor');
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
    } catch (error) {
      toast({ title: 'Failed to cancel invitation', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeBoardMember(memberId);
      refresh();
      toast({ title: 'Member removed' });
    } catch (error) {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
  };

  if (!board) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Invite Section — owner only */}
            {isOwner && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Invite by Email</Label>
                <p className="text-xs text-muted-foreground">
                  They'll sign up with this email and automatically join as an editor.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
                    className="flex-1"
                  />
                  <Button onClick={handleInvite} disabled={!inviteEmail.trim() || sending}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Pending Invites */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Invitations
                </Label>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">Waiting to sign up</p>
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
              </div>
            )}

            <Separator />

            {/* Board Owner */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Owner</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    {user?.user_metadata?.display_name?.slice(0, 2).toUpperCase() ||
                     user?.email?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isOwner ? 'You' : 'Board Owner'}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  Owner
                </Badge>
              </div>
            </div>

            {/* Team Members */}
            {members.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Editors ({members.length})</Label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                          {member.profile?.display_name?.slice(0, 2).toUpperCase() || 'U'}
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
                        <Badge variant="secondary" className="flex items-center gap-1">
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
                  ))}
                </div>
              </div>
            )}

            {members.length === 0 && invites.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No team members yet. Invite someone to collaborate!
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
