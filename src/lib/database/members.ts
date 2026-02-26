import { supabase } from '@/integrations/supabase/client';

export type BoardRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface DbBoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  created_at: string;
  updated_at: string;
}

export interface DbBoardInvite {
  id: string;
  board_id: string;
  email: string;
  role: BoardRole;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export interface BoardMemberWithProfile extends DbBoardMember {
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const fetchBoardMembers = async (boardId: string): Promise<BoardMemberWithProfile[]> => {
  // Fetch members
  const { data: membersData, error: membersError } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId);
  
  if (membersError) throw membersError;
  if (!membersData) return [];

  // Fetch profiles for all member user_ids
  const userIds = membersData.map(m => m.user_id);
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  // Combine members with profiles
  const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
  
  return membersData.map(member => ({
    ...member,
    profile: profilesMap.get(member.user_id) || undefined,
  })) as BoardMemberWithProfile[];
};

export const fetchBoardInvites = async (boardId: string) => {
  const { data, error } = await supabase
    .from('board_invites')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DbBoardInvite[];
};

export const createBoardInvite = async (boardId: string, email: string, role: BoardRole = 'editor') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('board_invites')
    .insert({
      board_id: boardId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DbBoardInvite;
};

export const deleteBoardInvite = async (inviteId: string) => {
  const { error } = await supabase
    .from('board_invites')
    .delete()
    .eq('id', inviteId);
  
  if (error) throw error;
};

export const updateMemberRole = async (memberId: string, role: BoardRole) => {
  const { data, error } = await supabase
    .from('board_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DbBoardMember;
};

export const removeBoardMember = async (memberId: string) => {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', memberId);
  
  if (error) throw error;
};

export const fetchMyInvites = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('board_invites')
    .select(`
      *,
      board:boards(name, description)
    `)
    .eq('email', user.email)
    .gt('expires_at', new Date().toISOString());
  
  if (error) throw error;
  return data;
};

export const fetchCurrentUserRole = async (boardId: string): Promise<BoardRole | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data?.role as BoardRole | null;
};

export const fetchUserMemberships = async (): Promise<{ board_id: string }[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('board_members')
    .select('board_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
};

export const acceptBoardInvite = async (inviteId: string) => {
  const { data, error } = await supabase
    .rpc('accept_board_invite', { _invite_id: inviteId });
  
  if (error) throw error;
  return data as boolean;
};
