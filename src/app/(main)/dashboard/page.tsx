// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/custom/DashboardClient";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/custom/DashboardSkeleton";
import { cache } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";
import { PerformanceMonitor } from "@/lib/performance";
import type { Work, ProgressLog } from "@/lib/types";
import type { Profile } from "@/types/profile";

async function DashboardContent() {
  return PerformanceMonitor.measureAsync('dashboard_data_fetch', async () => {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login");
    }

    // Map roles to database columns for filtering
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

    // Check cache for user profile
    const profileCacheKey = CACHE_KEYS.userProfile(user.id);
    let profile = cache.get(profileCacheKey) as Profile | null;

    if (!profile) {
      const { data: profileData } = await supabase.from("profiles").select("role, full_name, region, division, subdivision, circle, zone").eq("id", user.id).single();
      if (!profileData) {
        return <p className="p-4 text-red-500">Could not find your profile.</p>;
      }
      profile = profileData;
      cache.set(profileCacheKey, profile, 10 * 60 * 1000);
    }

    // Get the filtering value from profile based on role
    const profileField = profile?.role ? roleToProfileFieldMap[profile.role] : null;
    const filterValue = profileField && profile ? (profile as unknown as Record<string, unknown>)[profileField] : null;

    // Check cache for works data
    const worksCacheKey = CACHE_KEYS.userWorks(user.id, profile?.role || '', filterValue as string | undefined);
    let works = cache.get(worksCacheKey);

    if (!works) {
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

      const filterColumn = profile?.role ? roleToColumnMap[profile.role] : null;
      if (profile?.role !== 'superadmin' && filterColumn && filterValue) {
        worksQuery = worksQuery.eq(filterColumn, filterValue);
      }

      const { data: worksData, error: worksError } = await worksQuery;
      if (worksError) {
        return <p className="p-4 text-red-500">Failed to fetch works: {worksError.message}</p>;
      }

      works = worksData || [];
      cache.set(worksCacheKey, works, 5 * 60 * 1000);
    }

    // Check cache for progress logs
    const logsCacheKey = CACHE_KEYS.progressLogs();
    let progressLogs = cache.get(logsCacheKey);

    if (!progressLogs) {
      const { data: logsData, error: logsError } = await supabase
        .from("progress_logs")
        .select("id, work_id, user_email, previous_progress, new_progress, remark, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) {
        console.error("Failed to fetch progress logs:", logsError);
        progressLogs = [];
      } else {
        progressLogs = logsData || [];
      }

      cache.set(logsCacheKey, progressLogs, 3 * 60 * 1000);
    }

    return (
      <DashboardClient
        works={(works as Work[]) || []}
        profile={{ role: profile?.role || '', value: filterValue as string | null }}
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
