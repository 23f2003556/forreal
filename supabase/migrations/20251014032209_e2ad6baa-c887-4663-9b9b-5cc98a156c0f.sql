-- Fix chat analytics security: Restrict write operations to service role only
-- This prevents users from manipulating sentiment scores and analytics data

-- Remove the overly permissive policy that allows ALL operations
DROP POLICY IF EXISTS "System can manage chat insights" ON public.chat_insights;

-- Create a new policy that restricts ALL operations to service_role only
-- This ensures only the edge function (using service role key) can write/update/delete insights
CREATE POLICY "Service role manages insights"
ON public.chat_insights FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- The existing "Users can view insights for their chats" SELECT policy remains unchanged
-- Users can still view insights for their own chats, but cannot manipulate the data