"use client";

import { useState, useCallback } from "react";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import type { Work } from "@/lib/types";

interface AnalyticsClientProps {
  works: Work[];
  statusData: { name: string; value: number; }[];
  financialData: { name: string; value: number; }[];
  districtData: { name: string; total: number; }[];
  monthlyData: { month: string; total: number; completed: number; completionRate: number; }[];
  chartTitle: string;
  kpis: {
    totalWorks: number;
    completedWorks: number;
    notStartedWorks: number;
    blockedWorks: number;
    totalAgreementValue: number;
    completedValue: number;
    averageProgress: number;
  };
  colors: {
    completed: string;
    inProgress: string;
    notStarted: string;
    barChart: string;
  };
}

export function AnalyticsClient({ 
  works, 
  statusData, 
  financialData, 
  districtData, 
  monthlyData, 
  chartTitle, 
  kpis, 
  colors 
}: AnalyticsClientProps) {
  const [filteredWorks, setFilteredWorks] = useState<Work[]>(works);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedScheme, setSelectedScheme] = useState<string>('all');
  const [selectedWorkCategory, setSelectedWorkCategory] = useState<string>('all');

  // Get filtered works based on selected scheme and category
  const getFilteredWorks = useCallback((): Work[] => {
    return works.filter((w: Work) => {
      const matchesScheme = selectedScheme === 'all' || w.scheme_name === selectedScheme;
      const matchesCategory = selectedWorkCategory === 'all' || w.work_category === selectedWorkCategory;
      return matchesScheme && matchesCategory;
    });
  }, [works, selectedScheme, selectedWorkCategory]);

  // Recalculate status data based on filtered works
  const getFilteredStatusData = useCallback(() => {
    return filteredWorks.reduce(
      (acc: { name: string; value: number }[], work: Work) => {
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
  }, [filteredWorks]);

  // Recalculate financial data based on filtered works
  const getFilteredFinancialData = useCallback(() => {    
    // Initialize data with proper structure
    const initialData = [
      { name: 'Completed', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Not Started', value: 0 },
    ];

    // Calculate financial progress
    const result = filteredWorks.reduce((acc, work) => {
      // Ensure we have valid numbers
      const progress = Number(work.progress_percentage) || 0;
      const agreementAmount = Number(work.agreement_amount) || 0;
      
      if (agreementAmount === 0) return acc; // Skip if no agreement amount
      
      if (progress === 100) {
        // For completed works
        acc[0].value += agreementAmount;
      } else if (progress > 0 && progress < 100) {
        // For in-progress works (only if progress is between 1-99%)
        const progressAmount = (agreementAmount * progress) / 100;
        const remainingAmount = agreementAmount - progressAmount;
        acc[1].value += progressAmount; // Completed portion
        acc[2].value += remainingAmount; // Remaining portion
      } else {
        // For not started works (0% progress)
        acc[2].value += agreementAmount;
      }
      
      return acc;
    }, initialData);

    // Filter out segments with zero value
    const finalResult = result.filter(item => item.value > 0);
    
    console.log('Financial Data:', finalResult); // Debug log
    
    return finalResult;
  }, [getFilteredWorks]);

  // Recalculate district data based on filtered works
  const getFilteredDistrictData = useCallback(() => {
    const districtCounts = filteredWorks.reduce((acc, work) => {
      const district = work.district_name || 'N/A';
      if (!acc[district]) acc[district] = 0;
      acc[district]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(districtCounts)
      .map(name => ({ name, total: districtCounts[name] }))
      .sort((a, b) => b.total - a.total); // Sort by total in descending order
  }, [getFilteredWorks]);

  // Recalculate monthly data based on filtered works
  const getFilteredMonthlyData = useCallback(() => {
    const monthlyTrend = filteredWorks.reduce((acc, work) => {
      if (work.created_at) {
        const month = new Date(work.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) acc[month] = { total: 0, completed: 0 };
        acc[month].total++;
        if ((work.progress_percentage || 0) === 100) acc[month].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.keys(monthlyTrend)
      .map(month => ({
        month,
        total: monthlyTrend[month].total,
        completed: monthlyTrend[month].completed,
        completionRate: monthlyTrend[month].total > 0 ? (monthlyTrend[month].completed / monthlyTrend[month].total) * 100 : 0
      }))
      .slice(-6);
  }, [getFilteredWorks]);

  // Recalculate KPIs based on filtered works
  const getFilteredKPIs = useCallback(() => {
    const filteredWorks = getFilteredWorks();
    const totalWorks = filteredWorks.length;
    const completedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 100).length;
    const notStartedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 0).length;
    const blockedWorks = filteredWorks.filter(w => w.is_blocked).length;
    const totalAgreementValue = filteredWorks.reduce((sum, work) => sum + (work.agreement_amount || 0), 0);
    const completedValue = filteredWorks.reduce((sum, work) => {
      const progress = work.progress_percentage || 0;
      return sum + ((work.agreement_amount || 0) * progress) / 100;
    }, 0);
    const averageProgress = filteredWorks.length > 0 
      ? filteredWorks.reduce((sum, work) => sum + (work.progress_percentage || 0), 0) / filteredWorks.length 
      : 0;

    return {
      totalWorks,
      completedWorks,
      notStartedWorks,
      blockedWorks,
      totalAgreementValue,
      completedValue,
      averageProgress
    };
  }, [getFilteredWorks]);

  // Function to truncate work names
  const truncateWorkName = (name: string | null, maxLength: number = 30): string => {
    if (!name) return 'No name';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Function to get responsive truncation length
  const getTruncationLength = (isMobile: boolean = false): number => {
    return isMobile ? 20 : 50;
  };

  const handleKPIClick = (filterType: 'all' | 'completed' | 'in_progress' | 'not_started' | 'blocked') => {
    // First get scheme and category filtered works
    let baseWorks = works.filter(w => {
      const matchesScheme = selectedScheme === 'all' || w.scheme_name === selectedScheme;
      const matchesCategory = selectedWorkCategory === 'all' || w.work_category === selectedWorkCategory;
      return matchesScheme && matchesCategory;
    });

    // Then apply KPI filter
    let filtered: Work[] = [];
    switch (filterType) {
      case 'all':
        filtered = baseWorks;
        break;
      case 'completed':
        filtered = baseWorks.filter(work => (work.progress_percentage || 0) === 100);
        break;
      case 'in_progress':
        filtered = baseWorks.filter(work => {
          const progress = work.progress_percentage || 0;
          return progress > 0 && progress < 100;
        });
        break;
      case 'not_started':
        filtered = baseWorks.filter(work => (work.progress_percentage || 0) === 0);
        break;
      case 'blocked':
        filtered = baseWorks.filter(work => work.is_blocked);
        break;
    }
    
    setFilteredWorks(filtered);
    setActiveFilter(filterType);
  };

  const clearFilter = () => {
    // Apply only scheme and category filters without KPI filter
    const filtered = works.filter(w => {
      const matchesScheme = selectedScheme === 'all' || w.scheme_name === selectedScheme;
      const matchesCategory = selectedWorkCategory === 'all' || w.work_category === selectedWorkCategory;
      return matchesScheme && matchesCategory;
    });
    
    setFilteredWorks(filtered);
    setActiveFilter('all');
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'all': return 'All Works';
      case 'completed': return 'Completed Works';
      case 'in_progress': return 'In Progress Works';
      case 'not_started': return 'Not Started Works';
      case 'blocked': return 'Blocked Works';
      default: return 'All Works';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Status */}
      {activeFilter !== 'all' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Showing: {getFilterLabel(activeFilter)}
                  </p>
                  <p className="text-xs text-blue-700">
                    {filteredWorks.length} of {works.length} works
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilter}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheme Selector */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">NAME OF SCHEME</label>
              <select 
                value={selectedScheme}
                onChange={(e) => {
                  const newScheme = e.target.value;
                  setSelectedScheme(newScheme);
                  
                  // Apply both category and scheme filters
                  let filtered = works.filter(w => {
                    const matchesScheme = newScheme === 'all' || w.scheme_name === newScheme;
                    const matchesCategory = selectedWorkCategory === 'all' || w.work_category === selectedWorkCategory;
                    return matchesScheme && matchesCategory;
                  });

                  // Reapply KPI filter if active
                  if (activeFilter !== 'all') {
                    switch (activeFilter) {
                      case 'completed':
                        filtered = filtered.filter(work => (work.progress_percentage || 0) === 100);
                        break;
                      case 'in_progress':
                        filtered = filtered.filter(work => {
                          const progress = work.progress_percentage || 0;
                          return progress > 0 && progress < 100;
                        });
                        break;
                      case 'not_started':
                        filtered = filtered.filter(work => (work.progress_percentage || 0) === 0);
                        break;
                      case 'blocked':
                        filtered = filtered.filter(work => work.is_blocked);
                        break;
                    }
                  }
                  
                  setFilteredWorks(filtered);
                }}
                className="w-full sm:w-[300px] h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Schemes</option>
                {Array.from(new Set(works.map(w => w.scheme_name)))
                  .filter((scheme): scheme is string => scheme !== null && scheme !== '')
                  .sort()
                  .map(scheme => (
                    <option key={scheme} value={scheme}>{scheme}</option>
                  ))
                }
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">{selectedScheme === 'all' ? 'All Schemes' : selectedScheme}</span>
              <span>•</span>
              <span>{works.filter(w => selectedScheme === 'all' || w.scheme_name === selectedScheme).length} works</span>
            </div>
          </div>

          {/* Work Category Selector */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">WORK CATEGORY</label>
              <select 
                value={selectedWorkCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setSelectedWorkCategory(newCategory);
                  
                  // Apply both category and scheme filters
                  let filtered = works.filter(w => {
                    const matchesScheme = selectedScheme === 'all' || w.scheme_name === selectedScheme;
                    const matchesCategory = newCategory === 'all' || w.work_category === newCategory;
                    return matchesScheme && matchesCategory;
                  });

                  // Reapply KPI filter if active
                  if (activeFilter !== 'all') {
                    switch (activeFilter) {
                      case 'completed':
                        filtered = filtered.filter(work => (work.progress_percentage || 0) === 100);
                        break;
                      case 'in_progress':
                        filtered = filtered.filter(work => {
                          const progress = work.progress_percentage || 0;
                          return progress > 0 && progress < 100;
                        });
                        break;
                      case 'not_started':
                        filtered = filtered.filter(work => (work.progress_percentage || 0) === 0);
                        break;
                      case 'blocked':
                        filtered = filtered.filter(work => work.is_blocked);
                        break;
                    }
                  }
                  
                  setFilteredWorks(filtered);
                }}
                className="w-full sm:w-[300px] h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(works.map(w => w.work_category)))
                  .filter((category): category is string => category !== null && category !== '')
                  .sort()
                  .map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))
                }
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">{selectedWorkCategory === 'all' ? 'All Categories' : selectedWorkCategory}</span>
              <span>•</span>
              <span>{works.filter(w => selectedWorkCategory === 'all' || w.work_category === selectedWorkCategory).length} works</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <AnalyticsCharts
        statusData={getFilteredStatusData()}
        financialData={getFilteredFinancialData()}
        districtData={getFilteredDistrictData()}
        monthlyData={getFilteredMonthlyData()}
        chartTitle={chartTitle}
        kpis={getFilteredKPIs()}
        colors={colors}
        onKPIClick={handleKPIClick}
        activeFilter={activeFilter}
      />

      {/* Filtered Works Table */}
      {activeFilter !== 'all' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredWorks.length}
              </Badge>
              {getFilterLabel(activeFilter)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Scheme No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Work Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredWorks.map((work) => (
                    <tr key={work.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {work.scheme_sr_no}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="flex items-center gap-1">
                          <span className="truncate flex-1 min-w-0" title={work.work_name ?? undefined}>
                            {truncateWorkName(work.work_name ?? null, getTruncationLength(false))}
                          </span>
                          {(work.work_name && work.work_name.length > getTruncationLength(false)) && (
                            <Tooltip content={work.work_name ?? undefined}>
                              <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help flex-shrink-0" />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {work.district_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (work.progress_percentage || 0) === 100
                                  ? 'bg-green-500'
                                  : (work.progress_percentage || 0) > 0
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${work.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-slate-900 font-medium">
                            {work.progress_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        ₹{work.agreement_amount?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
