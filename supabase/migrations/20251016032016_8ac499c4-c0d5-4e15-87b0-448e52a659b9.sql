-- Create a SECURITY DEFINER function to find online users for matching
-- This solves the RLS policy mismatch while maintaining security
CREATE OR REPLACE FUNCTION public.find_online_users_for_matching(requesting_user_id uuid, max_results integer DEFAULT 20)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is requesting for themselves
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only find matches for self';
  END IF;
  
  -- Return online users excluding the requesting user
  -- Only expose non-sensitive profile fields needed for matching
  RETURN QUERY
  SELECT p.user_id, p.username, p.display_name, p.avatar_url
  FROM profiles p
  WHERE p.is_online = true
    AND p.user_id != requesting_user_id
  LIMIT max_results;
END;
$$;

-- Create a rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  last_request_at timestamp with time zone NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, action)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rate limits
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all rate limits
CREATE POLICY "Service role manages rate limits" ON public.rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action);