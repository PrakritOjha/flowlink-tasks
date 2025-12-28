import { useState } from 'react';
import { DbBoard } from '@/lib/database';
import { 
  BoardRole, 
  createBoardInvite, 
  deleteBoardInvite,
  updateMemberRole,
  removeBoardMember,
} from '@/lib/database/members';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Mail, 
  Crown, 
  Shield, 
  Pencil, 
  Eye, 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: DbBoard | null;
}

const roleIcons: Record<BoardRole, React.ReactNode> = {
  owner: <Crown className="w-4 h-4 text-yellow-500" />,
  admin: <Shield className="w-4 h-4 text-blue-500" />,
  editor: <Pencil className="w-4 h-4 text-green-500" />,
  viewer: <Eye className="w-4 h-4 text-muted-foreground" />,
};

const roleLabels: Record<BoardRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roleDescriptions: Record<BoardRole, string> = {
  owner: 'Full control including deletion',
  admin: 'Can manage members and settings',
  editor: 'Can create and edit tasks',
  viewer: 'View only access',
};

export const TeamManagementModal = ({ open, onOpenChange, board }: TeamManagementModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { members, invites, loading, refresh } = useBoardMembers(board?.id || null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<BoardRole>('editor');
  const [sending, setSending] = useState(false);

  const isOwner = board?.owner_id === user?.id;
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const canManage = isOwner || currentUserMember?.role === 'admin';

  const handleInvite = async () => {
    if (!board || !inviteEmail.trim()) return;

    setSending(true);
    try {
      await createBoardInvite(board.id, inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('editor');
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

  const handleUpdateRole = async (memberId: string, newRole: BoardRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      refresh();
      toast({ title: 'Role updated' });
    } catch (error) {
      toast({ title: 'Failed to update role', variant: 'destructive' });
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
            {/* Invite Section */}
            {canManage && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Invite by Email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as BoardRole)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                          <p className="text-xs text-muted-foreground">
                            Invited as {roleLabels[invite.role]}
                          </p>
                        </div>
                      </div>
                      {canManage && (
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
              <Label className="text-sm font-medium">Board Owner</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
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
                  {roleIcons.owner}
                  Owner
                </Badge>
              </div>
            </div>

            {/* Team Members */}
            {members.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team Members ({members.length})</Label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium">
                          {member.profile?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.profile?.display_name || 'Team Member'}
                            {member.user_id === user?.id && ' (You)'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roleDescriptions[member.role]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && member.user_id !== user?.id ? (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleUpdateRole(member.id, v as BoardRole)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {roleIcons[member.role]}
                            {roleLabels[member.role]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role Legend */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Role Permissions</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['viewer', 'editor', 'admin', 'owner'] as BoardRole[]).map((role) => (
                  <div key={role} className="flex items-center gap-2 p-2 rounded bg-muted/20">
                    {roleIcons[role]}
                    <div>
                      <p className="font-medium">{roleLabels[role]}</p>
                      <p className="text-muted-foreground">{roleDescriptions[role]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
