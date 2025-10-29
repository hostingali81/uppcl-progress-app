// src/app/(main)/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/custom/DashboardClient";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/custom/DashboardSkeleton";
import { cache } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";
import { PerformanceMonitor } from "@/lib/performance";
import type { Work, ProgressLog } from "@/lib/types";

// Using shared Work and ProgressLog types from src/lib/types.ts

// Map roles to database columns for filtering - UPDATED for new schema
const roleToColumnMap: { [key: string]: string } = {
    'je': 'je_name',
    'sub_division_head': 'civil_sub_division',
    'division_head': 'civil_division',
    'circle_head': 'civil_circle',
    'zone_head': 'civil_zone',
};

// Map roles to profile fields for filtering
const roleToProfileFieldMap: { [key: string]: string } = {
    'je': 'region',
    'sub_division_head': 'subdivision',
    'division_head': 'division',
    'circle_head': 'circle',
    'zone_head': 'zone',
};

async function DashboardContent() {
  return PerformanceMonitor.measureAsync('dashboard_data_fetch', async () => {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Debug: log server-side user object so we can confirm auth session is visible to server
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('Server-side supabase.auth.getUser() returned user:', user);
    }
    
    if (!user) { 
      return redirect("/login"); 
    }

    // Check cache for user profile
    const profileCacheKey = CACHE_KEYS.userProfile(user.id);
    let profile = cache.get(profileCacheKey);
    
    if (!profile) {
      const { data: profileData } = await supabase.from("profiles").select("role, full_name, region, division, subdivision, circle, zone").eq("id", user.id).single();
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('Profile query result for user.id=' + user.id + ':', profileData);
      }
      if (!profileData) { 
        return <p className="p-4 text-red-500">Could not find your profile.</p>; 
      }
      profile = profileData;
      // Cache profile for 10 minutes
      cache.set(profileCacheKey, profile, 10 * 60 * 1000);
    }

    // Get the filtering value from profile based on role
    const profileField = roleToProfileFieldMap[(profile as any).role];
    const filterValue = profileField ? (profile as any)[profileField] : null;

    // Check cache for works data
    const worksCacheKey = CACHE_KEYS.userWorks(user.id, (profile as any).role, filterValue);
    let works = cache.get(worksCacheKey);
    
    if (!works) {
      // Fetch works with more columns for filtering - UPDATED for new schema
      let worksQuery = supabase.from("works").select(`
        id, scheme_sr_no, scheme_name, work_name, work_category, wbs_code, district_name,
        civil_zone, civil_circle, civil_division, civil_sub_division,
        distribution_zone, distribution_circle, distribution_division, distribution_sub_division,
        je_name, site_name,
        sanction_amount_lacs, tender_no, boq_amount,
        nit_date, part1_opening_date, part2_opening_date, loi_no_and_date,
        rate_as_per_ag, agreement_amount, agreement_no_and_date,
        firm_name_and_contact, firm_contact_no, firm_email,
        start_date, scheduled_completion_date, actual_completion_date, weightage, progress_percentage, remark,
        mb_status, teco_status, fico_status, is_blocked
      `);
      
      const filterColumn = roleToColumnMap[(profile as any).role];
      if ((profile as any).role !== 'superadmin' && filterColumn && filterValue) {
        worksQuery = worksQuery.eq(filterColumn, filterValue);
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
    const logsCacheKey = CACHE_KEYS.progressLogs();
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
