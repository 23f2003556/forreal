-- Add length constraint to messages content column
-- This prevents extremely long messages and resource abuse
ALTER TABLE public.messages 
ADD CONSTRAINT messages_content_length_check 
CHECK (length(content) > 0 AND length(content) <= 5000);

-- Add comment for documentation
COMMENT ON CONSTRAINT messages_content_length_check ON public.messages 
IS 'Ensures message content is between 1 and 5000 characters to prevent abuse and maintain performance';