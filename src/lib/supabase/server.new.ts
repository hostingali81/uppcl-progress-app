import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables are not configured');
    }

    const cookieStore = await cookies();
    const cookieHandler = {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch (error) {
          console.error('Cookie get error:', error);
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          console.error('Cookie set error:', error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          console.error('Cookie remove error:', error);
        }
      }
    };

    return {
      client: createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: cookieHandler }
      ),
      admin: createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { 
          cookies: cookieHandler,
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    };
  } catch (error) {
    console.error('Supabase client creation error:', error);
    throw error;
  }
}