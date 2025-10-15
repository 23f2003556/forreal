-- Fix chat_queue RLS to prevent privacy leaks
-- Users should only see their own queue entry, not others' dating preferences

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all queue entries" ON public.chat_queue;

-- Create restricted policy - users can only view their own queue entry
CREATE POLICY "Users can view own queue entry"
ON public.chat_queue FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add policy for service role to manage queue matching
CREATE POLICY "Service role manages queue"
ON public.chat_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Users can view own queue entry" ON public.chat_queue 
IS 'Privacy protection: users can only see their own queue status, not others dating preferences';

COMMENT ON POLICY "Service role manages queue" ON public.chat_queue 
IS 'Allows server-side functions to perform queue matching securely';