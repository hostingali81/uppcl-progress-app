// @ts-nocheck
import { Header } from "@/components/custom/Header";
import { Sidebar } from "@/components/custom/Sidebar";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { handleUserProfile } from '@/types/profile';
import type { UserDetails } from '@/types/profile';
import { NotificationInitializer } from '@/components/custom/NotificationInitializer';
import { PullToRefresh } from '@/components/custom/PullToRefresh';
import { MainLayoutClient } from './layout-client';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Create Supabase clients
    const clients = await createSupabaseServerClient();

    // Get user with auth check
    const { data: { user }, error: authError } = await clients.client.auth.getUser();

    if (authError || !user) {
      console.error('Auth error or no user:', authError);
      return redirect('/login');
    }

    // Get user profile with admin client
    const userDetails = await handleUserProfile(clients.admin, user);

    // Return layout with profile data
    return (
      <MainLayoutClient userDetails={userDetails}>
        {children}
      </MainLayoutClient>
    );
  } catch (error) {
    console.error('Layout error:', error);
    return redirect('/login');
  }
}

