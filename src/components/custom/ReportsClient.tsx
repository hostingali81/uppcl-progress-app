"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportToExcelButton } from "@/components/custom/ExportToExcelButton";
import { ExportToPDFButton } from "@/components/custom/ExportToPDFButton";
import { DashboardFilters } from "@/components/custom/DashboardFilters";
import { FileText, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Work } from "@/lib/types";

interface ReportsClientProps {
  works: Work[];
  profile: {
    role: string;
  };
}

export function ReportsClient({ works, profile }: ReportsClientProps) {
  const [filteredWorks, setFilteredWorks] = useState<Work[]>(works);

  const summaryStats = useMemo(() => {
    const totalWorks = filteredWorks.length;
    const completedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 100).length;
    const inProgressWorks = filteredWorks.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100).length;
    const notStartedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 0).length;
    const blockedWorks = filteredWorks.filter(w => w.is_blocked).length;

    return { totalWorks, completedWorks, inProgressWorks, notStartedWorks, blockedWorks };
  }, [filteredWorks]);

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
              Generate and export reports. Your role: <Badge variant="outline" className="ml-1 text-xs">{profile.role}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600">Total Works</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalWorks}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600">Completed</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{summaryStats.completedWorks}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600">In Progress</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{summaryStats.inProgressWorks}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600">Not Started</div>
            <div className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">{summaryStats.notStartedWorks}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600">Blocked</div>
            <div className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{summaryStats.blockedWorks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-3 sm:p-6">
          <DashboardFilters
            works={works}
            userRole={profile.role}
            onFilterChange={setFilteredWorks}
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Export Reports</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-600">
            Export filtered data ({filteredWorks.length} works) in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed border-slate-200 hover:border-green-300 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Download className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Excel Report</h3>
                    <p className="text-sm text-slate-600 mt-1">Export data as Excel spreadsheet</p>
                  </div>
                  <div className="w-full">
                    <ExportToExcelButton 
                      selectedScheme="All" 
                      filteredWorks={filteredWorks}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-slate-200 hover:border-red-300 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Download className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">PDF Report</h3>
                    <p className="text-sm text-slate-600 mt-1">Export data as PDF document</p>
                  </div>
                  <div className="w-full">
                    <ExportToPDFButton 
                      selectedScheme="All" 
                      filteredWorks={filteredWorks}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Filtered Data Preview</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Showing {filteredWorks.length} works based on applied filters
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[300px] sm:min-w-[400px]">
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="font-semibold text-slate-900 min-w-[150px] sm:min-w-[180px]">
                    <span className="text-xs sm:text-sm">Name of Work</span>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 w-[80px] sm:w-[100px]">
                    <span className="text-xs sm:text-sm">District</span>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-900 w-[90px] sm:w-[110px]">
                    <span className="text-xs sm:text-sm">Progress</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.length > 0 ? (
                  filteredWorks.slice(0, 50).map((work: Work) => (
                    <TableRow key={work.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="min-w-[150px] sm:min-w-[180px]">
                        <div className="flex items-center gap-2">
                          {work.is_blocked && (
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          )}
                          <Link 
                            href={`/dashboard/work/${work.id}`} 
                            className="hover:underline text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm truncate block"
                            title={work.work_name || 'No name'}
                          >
                            {work.work_name || 'No name'}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px] sm:w-[100px]">
                        <span className="text-slate-600 truncate block text-xs sm:text-sm">
                          {work.district_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right w-[90px] sm:w-[110px]">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 sm:w-16 bg-slate-200 rounded-full h-2 relative overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                (work.progress_percentage || 0) === 100 ? 'bg-green-500' :
                                (work.progress_percentage || 0) >= 75 ? 'bg-blue-500' :
                                (work.progress_percentage || 0) >= 50 ? 'bg-yellow-500' :
                                (work.progress_percentage || 0) >= 25 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${work.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-slate-600 font-medium text-xs sm:text-sm min-w-[30px] sm:min-w-[35px] text-right">
                            {work.progress_percentage || 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-slate-400" />
                        <p className="text-lg font-medium">No works found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredWorks.length > 50 && (
            <div className="p-4 border-t border-slate-200 text-center text-sm text-slate-600">
              Showing first 50 of {filteredWorks.length} works. Export to see all data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
