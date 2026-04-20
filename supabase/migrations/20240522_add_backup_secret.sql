-- Add backup_secret column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_secret TEXT DEFAULT gen_random_uuid()::text;

-- Ensure existing users have a secret
UPDATE public.profiles SET backup_secret = gen_random_uuid()::text WHERE backup_secret IS NULL;