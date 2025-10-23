// src/app/(main)/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/custom/DashboardClient";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/custom/DashboardSkeleton";
import { cache, cacheKeys } from "@/lib/cache";
import { PerformanceMonitor } from "@/lib/performance";

// Types are used in DashboardClient component
type Work = {
  id: number;
  work_name: string | null;
  district_name: string | null;
  progress_percentage: number | null;
  wbs_code: string;
  is_blocked: boolean;
  zone_name: string | null;
  circle_name: string | null;
  division_name: string | null;
  sub_division_name: string | null;
  je_name: string | null;
};

type ProgressLog = {
  id: number;
  work_id: number;
  user_email: string | null;
  previous_progress: number | null;
  new_progress: number;
  remark: string | null;
  created_at: string;
};

// Map roles to database columns for filtering. This remains unchanged.
const roleToColumnMap: { [key: string]: string } = {
    'je': 'je_name',
    'sub_division_head': 'sub_division_name',
    'division_head': 'division_name',
    'circle_head': 'circle_name',
    'zone_head': 'zone_name',
};

async function DashboardContent() {
  return PerformanceMonitor.measureAsync('dashboard_data_fetch', async () => {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) { 
      return redirect("/login"); 
    }

    // Check cache for user profile
    const profileCacheKey = cacheKeys.userProfile(user.id);
    let profile = cache.get(profileCacheKey);
    
    if (!profile) {
      const { data: profileData } = await supabase.from("profiles").select("role, value").eq("id", user.id).single();
      if (!profileData) { 
        return <p className="p-4 text-red-500">Could not find your profile.</p>; 
      }
      profile = profileData;
      // Cache profile for 10 minutes
      cache.set(profileCacheKey, profile, 10 * 60 * 1000);
    }

    // Check cache for works data
    const worksCacheKey = cacheKeys.userWorks(user.id, (profile as any).role, (profile as any).value);
    let works = cache.get(worksCacheKey);
    
    if (!works) {
      // Fetch works with more columns for filtering
      let worksQuery = supabase.from("works").select(`
        id, work_name, district_name, progress_percentage, wbs_code, is_blocked,
        zone_name, circle_name, division_name, sub_division_name, je_name
      `);
      
      const filterColumn = roleToColumnMap[(profile as any).role];
      if ((profile as any).role !== 'superadmin' && filterColumn && (profile as any).value) {
        worksQuery = worksQuery.eq(filterColumn, (profile as any).value);
      }
      
      const { data: worksData, error: worksError } = await worksQuery;
      
      if (worksError) { 
        return <p className="p-4 text-red-500">Failed to fetch works: {worksError.message}</p>; 
      }
      
      works = worksData || [];
      // Cache works for 5 minutes
      cache.set(worksCacheKey, works, 5 * 60 * 1000);
    }

    // Check cache for progress logs
    const logsCacheKey = cacheKeys.progressLogs();
    let progressLogs = cache.get(logsCacheKey);
    
    if (!progressLogs) {
      // Fetch progress logs for historical data with error handling - LIMIT for better performance
      const { data: logsData, error: logsError } = await supabase
        .from("progress_logs")
        .select("id, work_id, user_email, previous_progress, new_progress, remark, created_at")
        .order("created_at", { ascending: false })
        .limit(500); // Limit progress logs for better performance

      if (logsError) {
        console.error("Failed to fetch progress logs:", logsError);
        progressLogs = [];
      } else {
        progressLogs = logsData || [];
      }
      
      // Cache progress logs for 3 minutes
      cache.set(logsCacheKey, progressLogs, 3 * 60 * 1000);
    }

    return (
      <DashboardClient 
        works={(works as Work[]) || []} 
        profile={profile as any}
        progressLogs={(progressLogs as ProgressLog[]) || []}
      />
    );
  });
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}