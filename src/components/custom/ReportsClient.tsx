"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportToExcelButton } from "@/components/custom/ExportToExcelButton";
import { ExportToPDFButton } from "@/components/custom/ExportToPDFButton";
import { DashboardFilters } from "@/components/custom/DashboardFilters";
import { DateFilter } from "@/components/custom/DateFilter";
import { Tooltip } from "@/components/ui/tooltip";
import { FileText, Download, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import type { Work, ProgressLog } from "@/lib/types";

interface ReportsClientProps {
  works: Work[];
  profile: {
    role: string;
  };
}

export function ReportsClient({ works, profile }: ReportsClientProps) {
  const [filteredWorks, setFilteredWorks] = useState<Work[]>(works);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: '',
    direction: 'asc'
  });
  const [regionalFilters, setRegionalFilters] = useState<{
    zone: string[];
    circle: string[];
    division: string[];
    subDivision: string[];
    je: string[];
    status: string[];
    search: string;
    scheme: string[];
    workCategory: string[];
    district: string[];
    distZone: string[];
    distCircle: string[];
    distDivision: string[];
    distSubDivision: string[];
    siteName: string[];
    mbStatus: string[];
    tecoStatus: string[];
    ficoStatus: string[];
    firmName: string[];
  }>({
    zone: [],
    circle: [],
    division: [],
    subDivision: [],
    je: [],
    status: [],
    search: '',
    scheme: [],
    workCategory: [],
    district: [],
    distZone: [],
    distCircle: [],
    distDivision: [],
    distSubDivision: [],
    siteName: [],
    mbStatus: [],
    tecoStatus: [],
    ficoStatus: [],
    firmName: []
  });

  // Handle filter state changes from DashboardFilters component
  const handleFilterStateChange = useCallback((filterState: {
    zone: string[];
    circle: string[];
    division: string[];
    subDivision: string[];
    je: string[];
    status: string[];
    search: string;
    scheme: string[];
    workCategory: string[];
    district: string[];
    distZone: string[];
    distCircle: string[];
    distDivision: string[];
    distSubDivision: string[];
    siteName: string[];
    mbStatus: string[];
    tecoStatus: string[];
    ficoStatus: string[];
    firmName: string[];
  }) => {
    setRegionalFilters(filterState);
  }, []);

  // Apply all current filters to a base list of works
  const applyFilters = useCallback((baseWorks: Work[]) => {
    let filtered = [...baseWorks];

    // Determine scheme and category filters from DashboardFilters
    const effectiveSchemes = regionalFilters.scheme && regionalFilters.scheme.length > 0
      ? regionalFilters.scheme
      : [];
    const effectiveCategories = regionalFilters.workCategory && regionalFilters.workCategory.length > 0
      ? regionalFilters.workCategory
      : [];

    if (effectiveSchemes.length > 0) {
      filtered = filtered.filter(w => effectiveSchemes.includes(w.scheme_name || ''));
    }
    if (effectiveCategories.length > 0) {
      filtered = filtered.filter(w => effectiveCategories.includes(w.work_category || ''));
    }

    // Additional filters from DashboardFilters (district, distZone, distCircle, distDivision, distSubDivision, siteName, mbStatus, tecoStatus, ficoStatus, firmName)
    if (regionalFilters.district.length > 0) {
      filtered = filtered.filter(w => regionalFilters.district.includes(w.district_name || ''));
    }
    if (regionalFilters.distZone.length > 0) {
      filtered = filtered.filter(w => regionalFilters.distZone.includes(w.distribution_zone || ''));
    }
    if (regionalFilters.distCircle.length > 0) {
      filtered = filtered.filter(w => regionalFilters.distCircle.includes(w.distribution_circle || ''));
    }
    if (regionalFilters.distDivision.length > 0) {
      filtered = filtered.filter(w => regionalFilters.distDivision.includes(w.distribution_division || ''));
    }
    if (regionalFilters.distSubDivision.length > 0) {
      filtered = filtered.filter(w => regionalFilters.distSubDivision.includes(w.distribution_sub_division || ''));
    }
    if (regionalFilters.siteName.length > 0) {
      filtered = filtered.filter(w => regionalFilters.siteName.includes(w.site_name || ''));
    }
    if (regionalFilters.mbStatus.length > 0) {
      filtered = filtered.filter(w => regionalFilters.mbStatus.includes(w.mb_status || ''));
    }
    if (regionalFilters.tecoStatus.length > 0) {
      filtered = filtered.filter(w => regionalFilters.tecoStatus.includes(w.teco_status || ''));
    }
    if (regionalFilters.ficoStatus.length > 0) {
      filtered = filtered.filter(w => regionalFilters.ficoStatus.includes(w.fico_status || ''));
    }
    if (regionalFilters.firmName.length > 0) {
      filtered = filtered.filter(w => regionalFilters.firmName.includes(w.firm_name_and_contact || ''));
    }

    // regional filters (zone/circle/division/subDivision/je)
    if (regionalFilters.zone.length > 0) {
      filtered = filtered.filter(w => regionalFilters.zone.includes(w.civil_zone || ''));
    }
    if (regionalFilters.circle.length > 0) {
      filtered = filtered.filter(w => regionalFilters.circle.includes(w.civil_circle || ''));
    }
    if (regionalFilters.division.length > 0) {
      filtered = filtered.filter(w => regionalFilters.division.includes(w.civil_division || ''));
    }
    if (regionalFilters.subDivision.length > 0) {
      filtered = filtered.filter(w => regionalFilters.subDivision.includes(w.civil_sub_division || ''));
    }
    if (regionalFilters.je.length > 0) {
      filtered = filtered.filter(w => regionalFilters.je.includes(w.je_name || ''));
    }

    // Status filters
    if (regionalFilters.status && regionalFilters.status.length > 0) {
      filtered = filtered.filter(w => {
        const progress = w.progress_percentage || 0;
        return regionalFilters.status!.some(st => {
          if (st === 'completed') return progress === 100;
          if (st === 'in_progress') return progress > 0 && progress < 100;
          if (st === 'not_started') return progress === 0;
          if (st === 'blocked') return !!w.is_blocked;
          return true;
        });
      });
    }

    // Search filter
    if (regionalFilters.search) {
      const searchLower = regionalFilters.search.toLowerCase();
      filtered = filtered.filter(w => (
        (w.work_name || '').toLowerCase().includes(searchLower) ||
        (w.wbs_code || '').toLowerCase().includes(searchLower) ||
        (w.district_name || '').toLowerCase().includes(searchLower)
      ));
    }

    return filtered;
  }, [regionalFilters]);

  const handleFilterChange = useCallback((filtered: Work[]) => {
    setFilteredWorks(filtered);
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

  // Fetch progress logs for historical data (only load once)
  const [progressLogs, setProgressLogs] = useState<Array<{
    id: number;
    work_id: number;
    new_progress: number;
    created_at: string;
  }>>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  // Load progress logs when component mounts
  useEffect(() => {
    const loadProgressLogs = async () => {
      try {
        const response = await fetch('/api/progress-logs');
        if (response.ok) {
          const data = await response.json();
          setProgressLogs(data || []);
        }
      } catch (error) {
        console.error('Failed to load progress logs:', error);
      } finally {
        setLogsLoaded(true);
      }
    };

    loadProgressLogs();
  }, []);

  // Calculate historical progress based on selected date for report generation
  const getHistoricalProgress = useMemo(() => {
    if (!selectedDate) return works; // Return current works if no date selected

    if (!logsLoaded || progressLogs.length === 0) return works; // Wait for logs to load

    // Convert selected date to YYYY-MM-DD format for comparison
    const selectedDateStr = selectedDate; // Already in YYYY-MM-DD format

    const historicalWorks = works.map(work => {
      // Find all progress logs for this work
      const workLogs = progressLogs.filter(log => log.work_id === work.id);

      if (workLogs.length === 0) {
        // No progress logs for this work, return as current
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

      // If no logs before selected date, return current work
      return work;
    });

    return historicalWorks;
  }, [works, progressLogs, selectedDate, logsLoaded]);

  // Update filtered works when filters change
  useEffect(() => {
    const base = getHistoricalProgress;
    const applied = applyFilters(base);
    setFilteredWorks(applied);
  }, [selectedDate, works.length, applyFilters, getHistoricalProgress]);

  const summaryStats = useMemo(() => {
    const totalWorks = filteredWorks.length;
    const completedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 100).length;
    const inProgressWorks = filteredWorks.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100).length;
    const notStartedWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 0).length;
    const blockedWorks = filteredWorks.filter(w => w.is_blocked).length;

    return { totalWorks, completedWorks, inProgressWorks, notStartedWorks, blockedWorks };
  }, [filteredWorks]);

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
            onFilterChange={handleFilterChange}
            onFilterStateChange={handleFilterStateChange}
          />
        </CardContent>
      </Card>

      {/* Archive Progress Filter - For Historical Report Generation */}
      <DateFilter
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
      />

      {/* Export Options */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                <FileText className="h-3 w-3 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900">Export Reports</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  {filteredWorks.length} works filtered
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ExportToExcelButton
                selectedScheme="All"
                filteredWorks={filteredWorks}
              />
              <ExportToPDFButton
                selectedScheme="All"
                filteredWorks={filteredWorks}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">Filtered Data Preview</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-600">
                Showing {filteredWorks.length} works based on applied filters
              </CardDescription>
            </div>
            {filteredWorks.length > 25 && (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 w-fit">
                Showing first 25 works • Export for full data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            {filteredWorks.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredWorks.slice(0, 25).map((work: Work, index: number) => (
                  <div key={work.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {work.is_blocked && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/work/${work.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-700 text-sm block"
                              title={work.work_name || 'No name'}
                            >
                              <span className="truncate block" style={{ maxWidth: '200px' }}>{work.work_name || 'No name'}</span>
                            </Link>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <div><span className="font-medium">WBS:</span> {work.wbs_code || 'N/A'}</div>
                          <div><span className="font-medium">District:</span> {work.district_name || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-lg font-bold text-slate-900">
                          {work.progress_percentage || 0}%
                        </div>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (work.progress_percentage || 0) === 100 ? 'bg-green-500' :
                              (work.progress_percentage || 0) >= 75 ? 'bg-blue-500' :
                              (work.progress_percentage || 0) >= 50 ? 'bg-yellow-500' :
                              (work.progress_percentage || 0) >= 25 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${work.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>{work.scheme_name || 'No scheme'}</span>
                      <span>{work.civil_circle || 'No circle'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">No works found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[200px]" onClick={() => handleSort('work_name')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Work Details</span>
                      {getSortIcon('work_name')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('district_name')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Location</span>
                      {getSortIcon('district_name')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('scheme_name')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Scheme & Category</span>
                      {getSortIcon('scheme_name')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none text-right" onClick={() => handleSort('progress_percentage')}>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm">Progress</span>
                      {getSortIcon('progress_percentage')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('agreement_amount')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Contract & Payments</span>
                      {getSortIcon('agreement_amount')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('start_date')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status</span>
                      {getSortIcon('start_date')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.length > 0 ? (
                  filteredWorks.slice(0, 25).map((work: Work) => (
                    <TableRow key={work.id} className="hover:bg-slate-50 transition-colors">
                      {/* Work Details Column */}
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            {work.is_blocked && (
                              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/dashboard/work/${work.id}`}
                                className="font-semibold text-blue-600 hover:text-blue-700 text-sm leading-tight block"
                                title={work.work_name || 'No name'}
                              >
                                <span className="truncate block w-full max-w-full" style={{ maxWidth: '500px' }}>{work.work_name || 'No name'}</span>
                              </Link>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <div><strong>WBS:</strong> {work.wbs_code || 'N/A'}</div>
                            <div><strong>Sanction:</strong> ₹{(work.sanction_amount_lacs || 0).toFixed(2)} L</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Location Column */}
                      <TableCell className="align-top">
                        <div className="text-xs space-y-1">
                          <div><strong>District:</strong> {work.district_name || 'N/A'}</div>
                          <div><strong>Circle:</strong> {work.civil_circle || 'N/A'}</div>
                          <div><strong>Division:</strong> {work.civil_division || 'N/A'}</div>
                        </div>
                      </TableCell>

                      {/* Scheme & Category Column */}
                      <TableCell className="align-top">
                        <div className="text-xs space-y-1">
                          <div><strong>Scheme:</strong> {work.scheme_name || 'N/A'}</div>
                          <div><strong>Category:</strong> {work.work_category || 'N/A'}</div>
                        </div>
                      </TableCell>

                      {/* Progress Column */}
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {work.progress_percentage || 0}%
                          </div>
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                (work.progress_percentage || 0) === 100 ? 'bg-green-500' :
                                (work.progress_percentage || 0) >= 75 ? 'bg-blue-500' :
                                (work.progress_percentage || 0) >= 50 ? 'bg-yellow-500' :
                                (work.progress_percentage || 0) >= 25 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${work.progress_percentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Contract & Payments Column */}
                      <TableCell className="align-top">
                        <div className="text-xs space-y-1">
                          <div><strong>Agreement:</strong> ₹{(work.agreement_amount || 0).toLocaleString('en-IN') || 'N/A'}</div>
                          <div><strong>MB Status:</strong> {work.mb_status || 'N/A'}</div>
                          <div><strong>TECO Status:</strong> {work.teco_status || 'N/A'}</div>
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="align-top">
                        <div className="text-xs space-y-1">
                          <div><strong>FICO Status:</strong> {work.fico_status || 'N/A'}</div>
                          <div><strong>Start Date:</strong> {work.start_date ? new Date(work.start_date).toLocaleDateString('en-IN') : 'N/A'}</div>
                          <div><strong>Completion:</strong> {work.actual_completion_date ? new Date(work.actual_completion_date).toLocaleDateString('en-IN') : work.scheduled_completion_date ? new Date(work.scheduled_completion_date).toLocaleDateString('en-IN') + ' (scheduled)' : 'N/A'}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-10 w-10 text-slate-300" />
                        <div>
                          <p className="text-slate-500 font-medium mb-1">No works found</p>
                          <p className="text-xs text-slate-400">Try adjusting your filters or check your permissions</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredWorks.length > 25 && (
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span>Showing first 25 of {filteredWorks.length} works</span>
                <span className="font-medium">Export to Excel/PDF for complete data</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
