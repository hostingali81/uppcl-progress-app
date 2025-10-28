// src/app/(main)/layout.tsx

import { Header } from "@/components/custom/Header";
import { Sidebar } from "@/components/custom/Sidebar";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userDetails;
  try {
    // Attempt to create Supabase client with validation
    let supabase;
    try {
      const result = await createSupabaseServerClient();
      supabase = result.client;
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return redirect('/login');
    }
    
    // Check auth status with timeout
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    
    const { data: { user }, error: authError } = await Promise.race([
      authPromise,
      timeoutPromise
    ]) as Awaited<typeof authPromise>;

    if (authError) {
      console.error('Auth error:', authError);
      return redirect('/login');
    }
    
    if (!user) {
      return redirect('/login');
    }

    // Fetch user profile with retry logic
    let profile = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .single();

        if (data) {
          profile = data;
          break;
        }

        if (error) {
          console.error(`Profile fetch attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      } catch (error) {
        console.error(`Profile fetch attempt ${retryCount + 1} failed with exception:`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    userDetails = {
      email: user.email,
      role: profile?.role || 'user',
      fullName: profile?.full_name || user.email,
    };
  } catch (error) {
    console.error('MainLayout error:', error);
    return redirect('/login');
  }
  // --- End of data fetching logic ---

  return (
    // Updated: Take full screen height and hide overflow
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Sidebar is now part of this flex container */}
      <Sidebar userDetails={userDetails} />
      
      {/* Updated: This container now handles header and scrollable content */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* Header always visible for mobile navigation */}
        <Header userDetails={userDetails} />
        
        {/* Updated: main tag made scrollable with error boundary */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-blue-50/50">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}