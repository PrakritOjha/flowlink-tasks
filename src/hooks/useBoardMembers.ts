import { useState, useEffect, useCallback } from 'react';
import {
  fetchBoardMembers,
  fetchBoardInvites,
  BoardMemberWithProfile,
  DbBoardInvite,
} from '@/lib/database/members';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerProfile {
  display_name: string | null;
}

export const useBoardMembers = (boardId: string | null, ownerId?: string | null) => {
  const [members, setMembers] = useState<BoardMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<DbBoardInvite[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>({ display_name: null });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!boardId) {
      setMembers([]);
      setInvites([]);
      setOwnerProfile({ display_name: null });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch members and invites independently so one failure doesn't block the other
      const [membersData, invitesData] = await Promise.all([
        fetchBoardMembers(boardId).catch(() => [] as BoardMemberWithProfile[]),
        fetchBoardInvites(boardId).catch(() => [] as DbBoardInvite[]),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Failed to load board members:', error);
    }

    // Fetch owner profile separately
    if (ownerId) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', ownerId)
          .maybeSingle();
        setOwnerProfile({ display_name: data?.display_name || null });
      } catch {
        // Non-critical
      }
    }

    setLoading(false);
  }, [boardId, ownerId]);

  useEffect(() => {
    loadData();
  }, [boardId, ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    members,
    invites,
    ownerProfile,
    loading,
    refresh: loadData,
  };
};
