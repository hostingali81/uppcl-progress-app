// src/app/(main)/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/custom/DashboardClient";

// Types are used in DashboardClient component

// Map roles to database columns for filtering. This remains unchanged.
const roleToColumnMap: { [key: string]: string } = {
    'je': 'je_name',
    'sub_division_head': 'sub_division_name',
    'division_head': 'division_name',
    'circle_head': 'circle_name',
    'zone_head': 'zone_name',
};

export default async function DashboardPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) { 
    return redirect("/login"); 
  }

  const { data: profile } = await supabase.from("profiles").select("role, value").eq("id", user.id).single();
  if (!profile) { 
    return <p className="p-4 text-red-500">Could not find your profile.</p>; 
  }

  // Fetch works with more columns for filtering
  let worksQuery = supabase.from("works").select(`
    id, work_name, district_name, progress_percentage, wbs_code, is_blocked,
    zone_name, circle_name, division_name, sub_division_name, je_name
  `);
  
  const filterColumn = roleToColumnMap[profile.role];
  if (profile.role !== 'superadmin' && filterColumn && profile.value) {
    worksQuery = worksQuery.eq(filterColumn, profile.value);
  }
  
  const { data: works, error: worksError } = await worksQuery;
  
  if (worksError) { 
    return <p className="p-4 text-red-500">Failed to fetch works: {worksError.message}</p>; 
  }

  // Fetch progress logs for historical data with error handling
  const { data: progressLogs, error: logsError } = await supabase
    .from("progress_logs")
    .select("id, work_id, user_email, previous_progress, new_progress, remark, created_at")
    .order("created_at", { ascending: false });

  if (logsError) {
    console.error("Failed to fetch progress logs:", logsError);
    // Continue without progress logs - historical view will show current data
  }

  return (
    <DashboardClient 
      works={works || []} 
      profile={profile}
      progressLogs={progressLogs || []}
    />
  );
}