import { useState, useEffect, useCallback } from 'react';
import { fetchMyInvites, acceptBoardInvite } from '@/lib/database/members';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface InviteWithBoard {
  id: string;
  board_id: string;
  email: string;
  role: string;
  expires_at: string;
  board: {
    name: string;
    description: string | null;
  };
}

export const usePendingInvites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteWithBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvites = useCallback(async () => {
    if (!user) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchMyInvites();
      setInvites(data as InviteWithBoard[]);
    } catch (error) {
      console.error('Failed to load invites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const acceptInvite = async (inviteId: string) => {
    try {
      const success = await acceptBoardInvite(inviteId);
      if (success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        toast({ title: 'Invitation accepted!' });
        return true;
      } else {
        toast({ title: 'Failed to accept invitation', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Failed to accept invitation', variant: 'destructive' });
      return false;
    }
  };

  return {
    invites,
    loading,
    acceptInvite,
    refresh: loadInvites,
  };
};
