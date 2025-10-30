import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createCookieHandler = (cookieStore: ReturnType<typeof cookies>) => ({
  get(name: string) {
    try {
      return cookieStore.get(name)?.value;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Cookie get error for ${name}:`, error.message);
      }
      return undefined;
    }
  },
  set(name: string, value: string, options: CookieOptions) {
    try {
      cookieStore.set({ name, value, ...options });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Cookie set error for ${name}:`, error.message);
      }
    }
  },
  remove(name: string, options: CookieOptions) {
    try {
      cookieStore.delete(name, options);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Cookie remove error for ${name}:`, error.message);
      }
    }
  }
});

interface SupabaseClients {
  client: ReturnType<typeof createServerClient<Database>>;
  admin: ReturnType<typeof createServerClient<Database>>;
}

export const createSupabaseServerClient = async (): Promise<SupabaseClients> => {
  const cookieStore = cookies();
  const cookieHandler = createCookieHandler(cookieStore);

  return {
    client: createServerClient<Database>(
      SUPABASE_URL,
      ANON_KEY,
      { cookies: cookieHandler }
    ),
    admin: createServerClient<Database>(
      SUPABASE_URL,
      SERVICE_KEY,
      {
        cookies: cookieHandler,
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
};
