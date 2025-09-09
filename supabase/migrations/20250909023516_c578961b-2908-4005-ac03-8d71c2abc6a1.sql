-- Fix the search path issue for the find_queue_match function
CREATE OR REPLACE FUNCTION public.find_queue_match(requesting_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_user_id UUID;
BEGIN
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