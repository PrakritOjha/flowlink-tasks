import { supabase } from '@/integrations/supabase/client';

export interface DbComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const fetchComments = async (taskId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as DbComment[];
};

export const createComment = async (taskId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DbComment;
};

export const updateComment = async (commentId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DbComment;
};

export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  
  if (error) throw error;
};
