import { usePendingInvites } from '@/hooks/usePendingInvites';
import { useBoardOptional } from '@/hooks/useBoard';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Check, X, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PendingInvitesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PendingInvitesModal = ({ open, onOpenChange }: PendingInvitesModalProps) => {
  const { invites, loading, acceptInvite } = usePendingInvites();
  const boardCtx = useBoardOptional();

  const handleAccept = async (inviteId: string) => {
    const success = await acceptInvite(inviteId);
    if (success) {
      boardCtx?.reloadBoards();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Board Invitations
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {invite.board?.name || 'Unknown Board'}
                      </h4>
                      {invite.board?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {invite.board.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">
                          {invite.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(invite.id)}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
