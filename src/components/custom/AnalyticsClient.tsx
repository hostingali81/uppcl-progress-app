"use client";

import { useState } from "react";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface Work {
  id: string;
  scheme_sr_no: string;
  scheme_name: string;
  work_name: string;
  district_name: string;
  progress_percentage: number;
  agreement_amount: number;
  is_blocked: boolean;
  created_at: string;
}

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

  const handleKPIClick = (filterType: 'all' | 'completed' | 'in_progress' | 'blocked') => {
    let filtered: Work[] = [];
    
    switch (filterType) {
      case 'all':
        filtered = works;
        break;
      case 'completed':
        filtered = works.filter(work => work.progress_percentage === 100);
        break;
      case 'in_progress':
        filtered = works.filter(work => work.progress_percentage > 0 && work.progress_percentage < 100);
        break;
      case 'blocked':
        filtered = works.filter(work => work.is_blocked);
        break;
    }
    
    setFilteredWorks(filtered);
    setActiveFilter(filterType);
  };

  const clearFilter = () => {
    setFilteredWorks(works);
    setActiveFilter('all');
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'all': return 'All Works';
      case 'completed': return 'Completed Works';
      case 'in_progress': return 'In Progress Works';
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

      {/* Analytics Charts */}
      <AnalyticsCharts
        statusData={statusData}
        financialData={financialData}
        districtData={districtData}
        monthlyData={monthlyData}
        chartTitle={chartTitle}
        kpis={kpis}
        colors={colors}
        onKPIClick={handleKPIClick}
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
                        <div className="max-w-xs truncate" title={work.work_name}>
                          {work.work_name}
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
                                work.progress_percentage === 100
                                  ? 'bg-green-500'
                                  : work.progress_percentage > 0
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${work.progress_percentage}%` }}
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
