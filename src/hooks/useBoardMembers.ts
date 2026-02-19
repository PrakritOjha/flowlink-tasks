import { useState, useEffect, useCallback } from 'react';
import {
  fetchBoardMembers,
  fetchBoardInvites,
  BoardMemberWithProfile,
  DbBoardInvite,
} from '@/lib/database/members';

export const useBoardMembers = (boardId: string | null) => {
  const [members, setMembers] = useState<BoardMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<DbBoardInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!boardId) {
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        fetchBoardMembers(boardId),
        fetchBoardInvites(boardId),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Failed to load board members:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadData();
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    members,
    invites,
    loading,
    refresh: loadData,
  };
};
