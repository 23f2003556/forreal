-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create a privacy-focused policy for dating/chat app
-- Users can view:
-- 1. Their own profile
-- 2. Profiles of users they're actively chatting with
CREATE POLICY "Users can view own and chat participant profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE status = 'active'
    AND (
      (user1_id = auth.uid() AND user2_id = profiles.user_id)
      OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
    )
  )
);