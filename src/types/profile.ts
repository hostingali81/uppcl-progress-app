import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  region: string | null;
  division: string | null;
  subdivision: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserDetails {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
}

export async function handleUserProfile(adminClient: any, user: User): Promise<UserDetails> {
  const defaultProfile: Profile = {
    id: user.id,
    full_name: user.email || 'User',
    role: 'user',
    region: null,
    division: null,
    subdivision: null
  };

  try {
    // 1) Try to read existing profile without modifying it
    const { data: existing, error: fetchError } = await adminClient
      .from('profiles')
      .select('role, full_name, region, division, subdivision, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Profile fetch failed:', fetchError);
    }

    if (existing) {
      // Never downgrade role; just return existing
      return {
        email: user.email,
        role: existing.role,
        fullName: existing.full_name,
      };
    }

    // 2) If not exists, insert a minimal default profile (role 'user')
    const { data: created, error: insertError } = await adminClient
      .from('profiles')
      .insert(defaultProfile)
      .select('role, full_name, region, division, subdivision, created_at, updated_at')
      .single();

    if (insertError || !created) {
      console.error('Profile insert failed:', insertError);
      return {
        email: user.email,
        role: 'user',
        fullName: user.email,
      };
    }

    return {
      email: user.email,
      role: created.role,
      fullName: created.full_name,
    };

  } catch (error) {
    console.error('Profile operation error:', error);
    return {
      email: user.email,
      role: 'user',
      fullName: user.email,
    };
  }
}