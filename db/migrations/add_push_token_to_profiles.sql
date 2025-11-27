-- Migration: Add push notification token to profiles
-- Date: 2025-11-27
-- This migration adds push token storage for FCM notifications

-- Add push_token column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token TEXT NULL;

-- Add timestamp for when the token was last updated
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS profiles_push_token_idx ON public.profiles (push_token);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.push_token IS 'Firebase Cloud Messaging (FCM) push notification token';
COMMENT ON COLUMN public.profiles.push_token_updated_at IS 'Timestamp when push token was last updated';
