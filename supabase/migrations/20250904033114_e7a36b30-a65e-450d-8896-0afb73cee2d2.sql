-- Add online presence tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN is_online BOOLEAN DEFAULT false;

-- Create index for faster online user queries
CREATE INDEX idx_profiles_online_status ON public.profiles(is_online, last_seen_at) WHERE is_online = true;

-- Create function to update user online status
CREATE OR REPLACE FUNCTION public.update_user_presence(user_uuid UUID, online_status BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_online = online_status,
    last_seen_at = CASE WHEN online_status THEN now() ELSE last_seen_at END
  WHERE user_id = user_uuid;
END;
$$;