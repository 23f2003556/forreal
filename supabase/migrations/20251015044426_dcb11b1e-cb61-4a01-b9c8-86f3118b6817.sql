-- Fix messages RLS policy to prevent sender_id spoofing
-- This prevents users from impersonating the bot or other users

-- Drop the existing policy that doesn't validate sender_id
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

-- Create new policy that enforces sender_id matches authenticated user
CREATE POLICY "Users can send their own messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id  -- Must match authenticated user
  AND EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = chat_session_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
    AND status = 'active'
  )
);

-- Allow service role to insert bot messages (server-side only)
CREATE POLICY "Service role can send bot messages"
ON public.messages FOR INSERT
TO service_role
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Users can send their own messages" ON public.messages 
IS 'Prevents sender_id spoofing by enforcing sender_id must match auth.uid()';

COMMENT ON POLICY "Service role can send bot messages" ON public.messages 
IS 'Allows server-side edge functions to send bot messages securely';