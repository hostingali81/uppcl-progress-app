// src/components/custom/DashboardClient.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { ExportToExcelButton } from "@/components/custom/ExportToExcelButton";
import { DashboardFilters } from "@/components/custom/DashboardFilters";
import { DateFilter } from "@/components/custom/DateFilter";
import { AlertTriangle, TrendingUp, Clock, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Play, Info } from "lucide-react";

// Define a type for the work object for better type safety.
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

// Define a type for progress logs
type ProgressLog = {
  id: number;
  work_id: number;
  user_email: string | null;
  previous_progress: number | null;
  new_progress: number;
  remark: string | null;
  created_at: string;
};

interface DashboardClientProps {
  works: Work[];
  profile: {
    role: string;
    value: string | null;
  };
  progressLogs: ProgressLog[];
}

export function DashboardClient({ works, profile, progressLogs }: DashboardClientProps) {
  const [filteredWorks, setFilteredWorks] = useState<Work[]>(works);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: '',
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeKPI, setActiveKPI] = useState<string>('all');
  const itemsPerPage = 20; // Show 20 items per page

  // Function to truncate work names
  const truncateWorkName = (name: string | null, maxLength: number = 30): string => {
    if (!name) return 'No name';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Function to get responsive truncation length
  const getTruncationLength = (isMobile: boolean = false): number => {
    return isMobile ? 20 : 120;
  };

  // Calculate historical progress based on selected date
  const getHistoricalProgress = useMemo(() => {
    if (!selectedDate) return works; // Return current works if no date selected
    
    // Convert selected date to YYYY-MM-DD format for comparison
    const selectedDateStr = selectedDate; // Already in YYYY-MM-DD format
    
    const historicalWorks = works.map(work => {
      // Find all progress logs for this work
      const workLogs = progressLogs.filter(log => log.work_id === work.id);
      
      if (workLogs.length === 0) {
        // No progress logs for this work, return original
        return work;
      }
      
      // Find logs on or before the selected date using string comparison
      const relevantLogs = workLogs.filter(log => {
        // Extract date part from log timestamp (YYYY-MM-DD)
        const logDateStr = log.created_at.split('T')[0];
        
        // Compare dates as strings (YYYY-MM-DD format)
        return logDateStr <= selectedDateStr;
      });
      
      if (relevantLogs.length > 0) {
        // Get the most recent log for this work on or before the selected date
        const latestLog = relevantLogs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          ...work,
          progress_percentage: latestLog.new_progress
        };
      }
      
      // If no logs before selected date, return original work
      return work;
    });
    
    return historicalWorks;
  }, [works, progressLogs, selectedDate]);

  const handleFilterChange = useCallback((filtered: Work[]) => {
    setFilteredWorks(filtered);
  }, []);

  const handleSortChange = useCallback((sorted: Work[]) => {
    setFilteredWorks(sorted);
  }, []);

  const handleDateChange = useCallback((date: string | null) => {
    setSelectedDate(date);
    
    // Validate date if provided
    if (date) {
      const selectedDateObj = new Date(date);
      const today = new Date();
      
      // Check if date is valid and not in future
      if (isNaN(selectedDateObj.getTime()) || selectedDateObj > today) {
        console.warn('Invalid date selected:', date);
        return;
      }
    }
  }, []);

  // Update filtered works whenever historical progress changes
  useEffect(() => {
    setFilteredWorks(getHistoricalProgress);
  }, [getHistoricalProgress]);

  const handleSort = useCallback((column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sort.column === column && sort.direction === 'asc') {
      newDirection = 'desc';
    }
    
    setSort({ column, direction: newDirection });
    
    const sortedWorks = [...filteredWorks].sort((a, b) => {
      let aVal = a[column as keyof Work];
      let bVal = b[column as keyof Work];
      
      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = (aVal as string)?.toLowerCase() || '';
        bVal = (bVal as string)?.toLowerCase() || '';
      }
      
      if (typeof aVal === 'number') {
        return newDirection === 'asc' ? ((aVal as number) - (bVal as number)) : ((bVal as number) - (aVal as number));
      }
      
      if (aVal && bVal && aVal < bVal) return newDirection === 'asc' ? -1 : 1;
      if (aVal && bVal && aVal > bVal) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredWorks(sortedWorks);
  }, [sort.column, sort.direction, filteredWorks]);

  const getSortIcon = (column: string) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sort.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleKPIClick = useCallback((type: 'completed' | 'in_progress' | 'not_started' | 'blocked' | 'all') => {
    let filtered: Work[] = [];
    
    switch (type) {
      case 'all':
        filtered = works;
        break;
      case 'completed':
        filtered = works.filter(w => (w.progress_percentage || 0) === 100);
        break;
      case 'in_progress':
        filtered = works.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100);
        break;
      case 'not_started':
        filtered = works.filter(w => (w.progress_percentage || 0) === 0);
        break;
      case 'blocked':
        filtered = works.filter(w => w.is_blocked);
        break;
    }
    
    setFilteredWorks(filtered);
    setActiveKPI(type);
  }, [works]);

  // Calculate summary statistics based on original works dataset - memoized for performance
  const summaryStats = useMemo(() => {
    const totalWorks = works?.length || 0;
    const completedWorks = works?.filter(w => (w.progress_percentage || 0) === 100).length || 0;
    const inProgressWorks = works?.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100).length || 0;
    const notStartedWorks = works?.filter(w => (w.progress_percentage || 0) === 0).length || 0;
    const blockedWorks = works?.filter(w => w.is_blocked).length || 0;
    
    return { totalWorks, completedWorks, inProgressWorks, notStartedWorks, blockedWorks };
  }, [works]);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredWorks.slice(startIndex, endIndex);
  }, [filteredWorks, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWorks]);

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
            Overview of all works assigned to you. Your role: <Badge variant="outline" className="ml-1 text-xs">{profile.role}</Badge>
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <ExportToExcelButton />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeKPI === 'all' ? 'ring-2 ring-blue-500 border-blue-500' : ''}`} onClick={() => handleKPIClick('all')}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Total Works</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{summaryStats.totalWorks}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeKPI === 'completed' ? 'ring-2 ring-green-500 border-green-500' : ''}`} onClick={() => handleKPIClick('completed')}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{summaryStats.completedWorks}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeKPI === 'in_progress' ? 'ring-2 ring-orange-500 border-orange-500' : ''}`} onClick={() => handleKPIClick('in_progress')}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">In Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{summaryStats.inProgressWorks}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeKPI === 'not_started' ? 'ring-2 ring-gray-500 border-gray-500' : ''}`} onClick={() => handleKPIClick('not_started')}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Not Started</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{summaryStats.notStartedWorks}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Play className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeKPI === 'blocked' ? 'ring-2 ring-red-500 border-red-500' : ''}`} onClick={() => handleKPIClick('blocked')}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Blocked</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{summaryStats.blockedWorks}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Date Filter */}
      <DateFilter 
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
      />

      {/* Filters and Sorting */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">Filter & Sort Works</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Use filters to find specific works and sort by any column
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <DashboardFilters 
            works={getHistoricalProgress}
            userRole={profile.role}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
        </CardContent>
      </Card>

      {/* Works Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Works Overview</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            {selectedDate ? 
              `Historical view as of ${new Date(selectedDate).toLocaleDateString('en-IN')} (${filteredWorks.length} of ${getHistoricalProgress.length} works shown)` :
              `Detailed list of all works assigned to you (${filteredWorks.length} of ${works.length} works shown)`
            }
            {totalPages > 1 && (
              <span className="ml-2 text-slate-500">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile-first responsive table */}
          <div className="overflow-x-auto">
            <Table className="min-w-[300px] sm:min-w-[400px]">
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead 
                    className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[180px] sm:min-w-[200px]"
                    onClick={() => handleSort('work_name')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">Name of Work</span>
                      {getSortIcon('work_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[35px] sm:min-w-[50px]"
                    onClick={() => handleSort('district_name')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">District</span>
                      {getSortIcon('district_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[50px] sm:min-w-[70px]"
                    onClick={() => handleSort('progress_percentage')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs sm:text-sm">Progress</span>
                      {getSortIcon('progress_percentage')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData && paginatedData.length > 0 ? (
                  paginatedData.map((work: Work) => (
                    <TableRow key={work.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="min-w-[180px] sm:min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {work.is_blocked && (
                            <span title="This work is blocked" className="flex items-center">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            </span>
                          )}
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Link 
                              href={`/dashboard/work/${work.id}`} 
                              className="hover:underline text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm flex-1 min-w-0"
                              title={work.work_name || 'No name'}
                            >
                              <span className="truncate block sm:hidden">
                                {truncateWorkName(work.work_name, getTruncationLength(true))}
                              </span>
                              <span className="truncate block hidden sm:block">
                                {truncateWorkName(work.work_name, getTruncationLength(false))}
                              </span>
                            </Link>
                            {(work.work_name && work.work_name.length > getTruncationLength(false)) && (
                              <Tooltip content={work.work_name}>
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600 cursor-help flex-shrink-0" />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[35px] sm:min-w-[50px]">
                        <Tooltip content={work.district_name || 'No district'}>
                          <span className="text-slate-600 truncate block text-xs sm:text-sm">
                            {work.district_name || 'No district'}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right min-w-[50px] sm:min-w-[70px]">
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
                        <TrendingUp className="h-8 w-8 text-slate-400" />
                        <p className="text-lg font-medium">No works found</p>
                        <p className="text-sm">Try adjusting your filters or check if works are assigned to you.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWorks.length)} of {filteredWorks.length} works
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
