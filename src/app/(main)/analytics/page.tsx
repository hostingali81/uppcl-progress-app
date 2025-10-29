// src/app/(main)/analytics/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/custom/AnalyticsClient";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";
import { cache } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";
import type { Work } from "@/lib/types";

// Use shared Work type from src/lib/types.ts

// This mapping logic remains unchanged.
const roleToColumnMap: { [key:string]: string } = {
  'je': 'je_name',
  'sub_division_head': 'sub_division_name',
  'division_head': 'division_name',
  'circle_head': 'circle_name',
  'zone_head': 'zone_name',
};

export default async function AnalyticsPage() {
  // --- DATA FETCHING AND PROCESSING LOGIC WITH CACHING ---
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }
  
  // Check cache for user profile
  const profileCacheKey = CACHE_KEYS.userProfile(user.id);
  let profile = cache.get(profileCacheKey);
  
  if (!profile) {
    const { data: profileData } = await supabase.from("profiles").select("role, value").eq("id", user.id).single();
    if (!profileData) {
      return <p className="p-8 text-red-500">Could not find your profile.</p>;
    }
    profile = profileData;
    // Cache profile for 10 minutes
    cache.set(profileCacheKey, profile, 10 * 60 * 1000);
  }
  
  // Check cache for works data
  const worksCacheKey = CACHE_KEYS.userWorks(user.id, (profile as any).role, (profile as any).value);
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
      start_date, scheduled_completion_date, weightage, progress_percentage, remark,
      wbs_code, mb_status, teco_status, fico_status, is_blocked
    `);
    
    const filterColumn = roleToColumnMap[(profile as any).role];
    if ((profile as any).role !== 'superadmin' && filterColumn && (profile as any).value) {
      worksQuery = worksQuery.eq(filterColumn, (profile as any).value);
    }

    const { data: worksData, error } = await worksQuery;

    if (error) {
      return <p className="p-8 text-red-500">Failed to fetch analytics data: {error.message}</p>;
    }

    works = worksData || [];
    // Cache works for 5 minutes
    cache.set(worksCacheKey, works, 5 * 60 * 1000);
  }

  if (!works || (works as any).length === 0) {
     return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                <p className="text-slate-600">Visual insights into your project data</p>
              </div>
            </div>
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <PieChart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Data Available</h3>
                <p className="text-slate-600">No data is available for analysis at this time.</p>
              </CardContent>
            </Card>
        </div>
     );
  }
  
  // Enhanced data aggregation for charts
  const worksData = (works as Work[]) || [];
  
  // Status data
  const statusData = worksData.reduce(
    (acc, work) => {
      const progress = work.progress_percentage || 0;
      if (progress === 100) acc[0].value += 1;
      else if (progress > 0) acc[1].value += 1;
      else acc[2].value += 1;
      return acc;
    },
    [
      { name: 'Completed', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Not Started', value: 0 },
    ]
  );

  // Financial progress data (agreement_amount * progress_percentage)
  const financialData = worksData.reduce((acc, work) => {
    const progress = work.progress_percentage || 0;
    const agreementAmount = work.agreement_amount || 0;
    
    if (progress === 100) {
      // For completed works, add full amount to completed
      acc[0].value += agreementAmount;
    } else if (progress > 0) {
      // For in-progress works, split the amount between in-progress and not-started
      const progressAmount = (agreementAmount * progress) / 100;
      const remainingAmount = agreementAmount - progressAmount;
      acc[1].value += progressAmount;
      acc[2].value += remainingAmount;
    } else {
      // For not started works, add full amount to not-started
      acc[2].value += agreementAmount;
    }
    
    return acc;
  }, [
    { name: 'Completed', value: 0 },
    { name: 'In Progress', value: 0 },
    { name: 'Not Started', value: 0 },
  ]);

  // District-wise data
  const districtCounts = worksData.reduce((acc, work) => {
    const district = work.district_name || 'N/A';
    if (!acc[district]) acc[district] = 0;
    acc[district]++;
    return acc;
  }, {} as Record<string, number>);

  const districtData = Object.keys(districtCounts).map(name => ({ name, total: districtCounts[name] }));

  // Monthly progress trend (last 6 months)
  const monthlyTrend = worksData.reduce((acc, work) => {
    if (work.start_date) {
      const month = new Date(work.start_date as any).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) acc[month] = { total: 0, completed: 0 };
      acc[month].total++;
      if ((work.progress_percentage || 0) === 100) acc[month].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const monthlyData = Object.keys(monthlyTrend).map(month => ({
    month,
    total: monthlyTrend[month].total,
    completed: monthlyTrend[month].completed,
    completionRate: monthlyTrend[month].total > 0 ? (monthlyTrend[month].completed / monthlyTrend[month].total) * 100 : 0
  })).slice(-6); // Last 6 months

  // KPI calculations
  const totalWorks = worksData.length;
  const completedWorks = worksData.filter(w => (w.progress_percentage || 0) === 100).length;
  const notStartedWorks = worksData.filter(w => (w.progress_percentage || 0) === 0).length;
  const blockedWorks = worksData.filter(w => w.is_blocked).length;
  const totalAgreementValue = worksData.reduce((sum, work) => sum + (work.agreement_amount || 0), 0);
  const completedValue = worksData.reduce((sum, work) => {
    const progress = work.progress_percentage || 0;
    return sum + ((work.agreement_amount || 0) * progress) / 100;
  }, 0);
  const averageProgress = worksData.length > 0 ? worksData.reduce((sum, work) => sum + (work.progress_percentage || 0), 0) / worksData.length : 0;
  
  // Generate chart title based on user role
  const getChartTitle = (role: string) => {
    // Always return 'Works by District' regardless of role
    return 'Works by District';
  };
  
  const chartTitle = getChartTitle((profile as any).role);
  // --- END OF DATA LOGIC ---

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600">
              Visual overview of the works within your jurisdiction
            </p>
          </div>
       </div>

      {/* The AnalyticsClient component handles both charts and filtering functionality */}
      <AnalyticsClient 
        works={worksData}
        statusData={statusData}
        financialData={financialData}
        districtData={districtData}
        monthlyData={monthlyData}
        chartTitle={chartTitle}
        kpis={{
          totalWorks,
          completedWorks,
          notStartedWorks,
          blockedWorks,
          totalAgreementValue,
          completedValue,
          averageProgress
        }}
        colors={{
          completed: '#16A34A', // Green-600
          inProgress: '#2563EB', // Blue-600
          notStarted: '#9CA3AF', // Slate-400
          barChart: '#2563EB' // Blue-600 for the bar chart
        }}
      />
    </div>
  );
}