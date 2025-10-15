-- Fix chat_queue RLS to prevent privacy leaks
-- Drop the overly permissive policy if it still exists
DROP POLICY IF EXISTS "Users can view all queue entries" ON public.chat_queue;

-- Ensure service role can manage queue for matching (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_queue' 
    AND policyname = 'Service role manages queue'
  ) THEN
    CREATE POLICY "Service role manages queue"
    ON public.chat_queue FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON POLICY "Users can view own queue entry" ON public.chat_queue 
IS 'Privacy protection: users can only see their own queue status, not others dating preferences';

COMMENT ON POLICY "Service role manages queue" ON public.chat_queue 
IS 'Allows server-side functions to perform queue matching securely';