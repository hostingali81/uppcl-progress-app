// src/app/(main)/layout.tsx

import { Header } from "@/components/custom/Header";
import { Sidebar } from "@/components/custom/Sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- Data fetching logic remains unchanged ---
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const userDetails = {
    email: user.email,
    role: profile?.role || 'user',
    fullName: profile?.full_name || user.email,
  };
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
        
        {/* Updated: main tag made scrollable */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-blue-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}