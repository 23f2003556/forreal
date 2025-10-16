-- Fix SECURITY DEFINER functions to add authorization checks
-- This prevents privilege escalation attacks

-- Fix 1: Add auth check to update_user_presence
-- Critical: Prevents users from manipulating other users' online status
CREATE OR REPLACE FUNCTION public.update_user_presence(user_uuid uuid, online_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow updating own presence
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only update own presence';
  END IF;
  
  UPDATE public.profiles 
  SET 
    is_online = online_status,
    last_seen_at = CASE WHEN online_status THEN now() ELSE last_seen_at END
  WHERE user_id = user_uuid;
END;
$$;

-- Fix 2: Add auth check to find_queue_match
-- Prevents users from manipulating other users' queue matching
CREATE OR REPLACE FUNCTION public.find_queue_match(requesting_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  matched_user_id UUID;
BEGIN
  -- Verify caller is requesting for themselves
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only request matches for self';
  END IF;
  
  -- Find another user in the queue (excluding the requesting user)
  SELECT user_id INTO matched_user_id
  FROM public.chat_queue
  WHERE user_id != requesting_user_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If a match is found, remove both users from the queue
  IF matched_user_id IS NOT NULL THEN
    DELETE FROM public.chat_queue 
    WHERE user_id IN (requesting_user_id, matched_user_id);
  END IF;
  
  RETURN matched_user_id;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.update_user_presence(uuid, boolean) 
IS 'Updates user online status. Validates that the caller can only update their own presence.';

COMMENT ON FUNCTION public.find_queue_match(uuid) 
IS 'Finds a match for a user in the chat queue. Validates that the caller can only request matches for themselves.';