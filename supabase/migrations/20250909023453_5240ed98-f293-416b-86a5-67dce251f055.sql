-- Create a chat queue table to manage users waiting for chat matches
CREATE TABLE public.chat_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[],
  gender_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.chat_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for chat queue
CREATE POLICY "Users can view all queue entries" 
ON public.chat_queue 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own queue entry" 
ON public.chat_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entry" 
ON public.chat_queue 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entry" 
ON public.chat_queue 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to find and match users from queue
CREATE OR REPLACE FUNCTION public.find_queue_match(requesting_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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