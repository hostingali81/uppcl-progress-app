// src/app/(main)/analytics/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/custom/AnalyticsClient";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";
import { cache, cacheKeys } from "@/lib/cache";

// Type definition for a single work record for analytics purposes.
type Work = {
  id: string;
  scheme_sr_no: string;
  scheme_name: string;
  work_name: string;
  progress_percentage: number;
  division_name: string | null;
  sub_division_name: string | null;
  circle_name: string | null;
  zone_name: string | null;
  district_name: string;
  agreement_amount: number;
  is_blocked: boolean;
  created_at: string;
};

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
  const profileCacheKey = cacheKeys.userProfile(user.id);
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
  const worksCacheKey = cacheKeys.userWorks(user.id, profile.role, profile.value);
  let works = cache.get(worksCacheKey);
  
  if (!works) {
    let worksQuery = supabase.from("works").select("id, scheme_sr_no, scheme_name, work_name, progress_percentage, division_name, sub_division_name, circle_name, zone_name, district_name, agreement_amount, is_blocked, created_at");
    
    const filterColumn = roleToColumnMap[profile.role];
    if (profile.role !== 'superadmin' && filterColumn && profile.value) {
      worksQuery = worksQuery.eq(filterColumn, profile.value);
    }

    const { data: worksData, error } = await worksQuery;

    if (error) {
      return <p className="p-8 text-red-500">Failed to fetch analytics data: {error.message}</p>;
    }

    works = worksData || [];
    // Cache works for 5 minutes
    cache.set(worksCacheKey, works, 5 * 60 * 1000);
  }

  if (!works || works.length === 0) {
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
  const worksData = works as Work[];
  
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
    const financialProgress = (agreementAmount * progress) / 100;
    
    if (progress === 100) acc[0].value += financialProgress;
    else if (progress > 0) acc[1].value += financialProgress;
    else acc[2].value += financialProgress;
    
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
    if (work.created_at) {
      const month = new Date(work.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
  const blockedWorks = worksData.filter(w => w.is_blocked).length;
  const totalAgreementValue = worksData.reduce((sum, work) => sum + (work.agreement_amount || 0), 0);
  const completedValue = worksData.reduce((sum, work) => {
    const progress = work.progress_percentage || 0;
    return sum + ((work.agreement_amount || 0) * progress) / 100;
  }, 0);
  const averageProgress = worksData.length > 0 ? worksData.reduce((sum, work) => sum + (work.progress_percentage || 0), 0) / worksData.length : 0;
  
  // Generate chart title based on user role
  const getChartTitle = (role: string) => {
    switch (role) {
      case 'je':
        return 'Works by District';
      case 'sub_division_head':
        return 'Works by District';
      case 'division_head':
        return 'Works by Sub-Division';
      case 'circle_head':
        return 'Works by Division';
      case 'zone_head':
        return 'Works by Circle';
      case 'superadmin':
        return 'Works by Division';
      default:
        return 'Works by Division';
    }
  };
  
  const chartTitle = getChartTitle(profile.role);
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