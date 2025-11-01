import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/custom/DashboardClient";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/custom/DashboardSkeleton";
import type { Work, ProgressLog } from "@/lib/types";

export default async function SchemePage({ params }: { params: Promise<{ scheme: string }> }) {
  const { scheme } = await params;
  const schemeName = decodeURIComponent(scheme);
  
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile) return <p className="p-4 text-red-500">Could not find your profile.</p>;

  const { data: works } = await supabase.from("works").select("*").eq("scheme_name", schemeName);
  const { data: progressLogs } = await supabase.from("progress_logs").select("*").order("created_at", { ascending: false }).limit(500);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient 
        works={(works as Work[]) || []} 
        profile={profile as any}
        progressLogs={(progressLogs as ProgressLog[]) || []}
      />
    </Suspense>
  );
}
