-- Fix board_invites SELECT policy: replace auth.users subquery with auth.jwt()
-- The authenticated role cannot query auth.users directly, causing 403 errors.

DROP POLICY IF EXISTS "Users can view invites for boards they manage" ON board_invites;

CREATE POLICY "Users can view invites for boards they manage"
  ON board_invites
  FOR SELECT
  USING (
    can_manage_board(board_id, auth.uid())
    OR email = (auth.jwt() ->> 'email')
  );
