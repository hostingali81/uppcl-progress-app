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

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar userDetails={userDetails} />
      <div className="flex flex-1 flex-col">
        <Header userDetails={userDetails} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}