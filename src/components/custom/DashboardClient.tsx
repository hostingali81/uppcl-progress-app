// src/components/custom/DashboardClient.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";



import { AlertTriangle, TrendingUp, Clock, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Play, Info, ChevronDown, Filter, X } from "lucide-react";

import type { Work, ProgressLog } from "@/lib/types";

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
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
  const [selectedWorkCategories, setSelectedWorkCategories] = useState<string[]>([]);
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
  const handleFilterStateChange = (filterState: {
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
  };

  // Apply all current filters (schemes, categories, regional filters and KPI) to a base list of works
  const applyFilters = useCallback((baseWorks: Work[]) => {
    let filtered = [...baseWorks];

    // Determine scheme and category filters. Prefer filter state coming from
    // the DashboardFilters component (regionalFilters.scheme/workCategory).
    // Fall back to the local top-bar selections if those are used.
    const effectiveSchemes = (regionalFilters.scheme && regionalFilters.scheme.length > 0)
      ? regionalFilters.scheme
      : selectedSchemes;
    const effectiveCategories = (regionalFilters.workCategory && regionalFilters.workCategory.length > 0)
      ? regionalFilters.workCategory
      : selectedWorkCategories;

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

    // Status filters from regionalFilters.status
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

    // KPI filter (clicked on summary cards)
    switch (activeKPI) {
      case 'completed':
        filtered = filtered.filter(w => (w.progress_percentage || 0) === 100);
        break;
      case 'in_progress':
        filtered = filtered.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100);
        break;
      case 'not_started':
        filtered = filtered.filter(w => (w.progress_percentage || 0) === 0);
        break;
      case 'blocked':
        filtered = filtered.filter(w => !!w.is_blocked);
        break;
      default:
        break;
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
  }, [selectedSchemes, selectedWorkCategories, regionalFilters, activeKPI]);

  // Helper function to get filter summary text
  const getFilterSummaryText = (filterName: string, values: string[]) => {
    if (values.length === 0) {
      return `All ${filterName}`;
    } else if (values.length === 1) {
      return values[0];
    } else {
      return `${values.length} ${filterName}`;
    }
  };
  const itemsPerPage = 20; // Show 20 items per page
  const [schemesDropdownOpen, setSchemesDropdownOpen] = useState<boolean>(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState<boolean>(false);

  // Function to truncate work names
  const truncateWorkName = (name?: string | null, maxLength: number = 30): string => {
    if (!name) return 'No name';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Function to truncate remarks
  const truncateRemarks = (remark?: string | null, maxLength: number = 40): string => {
    if (!remark) return 'No remarks';
    if (remark.length <= maxLength) return remark;
    return remark.substring(0, maxLength) + '...';
  };

  // Function to get responsive truncation length
  const getTruncationLength = (isMobile: boolean = false): number => {
    return isMobile ? 15 : 40;
  };

  // Function to get responsive truncation length for remarks
  const getRemarksTruncationLength = (isMobile: boolean = false): number => {
    return isMobile ? 20 : 50;
  };

  // Helper function to check if tooltip should be shown
  const shouldShowTooltip = (workName?: string | null) => {
    if (!workName) return false;
    // Show tooltip if text is longer than mobile truncation length (20 chars)
    // Mobile mein tooltip show karna chahiye jab text 20+ characters ho
    return workName.length > getTruncationLength(true);
  };

  // Helper function to get the last progress remark for a work
  const getLastProgressRemark = useCallback((workId: string | number) => {
    const workLogs = progressLogs.filter(log => log.work_id === Number(workId));
    if (workLogs.length === 0) return 'No remarks';
    // Get the most recent log by created_at
    const latestLog = workLogs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return latestLog.remark || 'No remarks';
  }, [progressLogs]);

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

  // Update filtered works when selected date or source data changes.
  // Instead of overwriting any user-applied filters, re-apply the current
  // filter state on top of the historical dataset so the date selection
  // doesn't reset other filters.
  useEffect(() => {
    const base = getHistoricalProgress;
    const applied = applyFilters(base);
    setFilteredWorks(applied);
    // reset to first page when applying new filters
    setCurrentPage(1);
  }, [selectedDate, works.length, progressLogs.length, applyFilters, getHistoricalProgress]);

  const handleSort = useCallback((column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (sort.column === column && sort.direction === 'asc') {
      newDirection = 'desc';
    }

    setSort({ column, direction: newDirection });

    const sortedWorks = [...filteredWorks].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      // Handle special case for last_remarks column
      if (column === 'last_remarks') {
        aVal = getLastProgressRemark(a.id)?.toLowerCase() || '';
        bVal = getLastProgressRemark(b.id)?.toLowerCase() || '';
      } else {
        // Handle regular column sorting
        let tempAVal = a[column as keyof Work];
        let tempBVal = b[column as keyof Work];

        // Handle different data types
        if (typeof tempAVal === 'string') {
          aVal = (tempAVal as string)?.toLowerCase() || '';
          bVal = (tempBVal as string)?.toLowerCase() || '';
        } else if (typeof tempAVal === 'number') {
          return newDirection === 'asc' ? ((tempAVal as number) - (tempBVal as number)) : ((tempBVal as number) - (tempAVal as number));
        } else {
          aVal = String(tempAVal || '');
          bVal = String(tempBVal || '');
        }
      }

      if (aVal < bVal) return newDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredWorks(sortedWorks);
  }, [sort.column, sort.direction, filteredWorks, getLastProgressRemark]);

  const getSortIcon = (column: string) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sort.direction === 'asc' ?
      <ArrowUp className="h-4 w-4 text-blue-600" /> :
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Get available schemes and categories
  const getAvailableSchemes = useCallback(() => {
    return Array.from(new Set(works.map(w => w.scheme_name)))
      .filter((scheme): scheme is string => scheme !== null && scheme !== '')
      .sort();
  }, [works]);

  const getAvailableCategories = useCallback(() => {
    return Array.from(new Set(works.map(w => w.work_category)))
      .filter((category): category is string => category !== null && category !== '')
      .sort();
  }, [works]);

  // Handle scheme selection
  // Add state to prevent dropdown closing on selection
  const [keepSchemesDropdownOpen, setKeepSchemesDropdownOpen] = useState(false);

  const handleSchemeToggle = useCallback((scheme: string, checked: boolean) => {
    let newSelectedSchemes: string[];
    if (checked) {
      newSelectedSchemes = [...selectedSchemes, scheme];
    } else {
      newSelectedSchemes = selectedSchemes.filter(s => s !== scheme);
    }
    setSelectedSchemes(newSelectedSchemes);

    // Keep dropdown open for multi-selection, close only when selecting all or none
    if (newSelectedSchemes.length === 0) {
      setKeepSchemesDropdownOpen(false);
      setSchemesDropdownOpen(false);
    } else if (newSelectedSchemes.length !== getAvailableSchemes().length) {
      setKeepSchemesDropdownOpen(true);
    } else {
      // If all are selected, close (equivalent to "All" selection)
      setKeepSchemesDropdownOpen(false);
      setSchemesDropdownOpen(false);
    }

    // Apply filters
    let filtered = works.filter(w => {
      const matchesScheme = newSelectedSchemes.length === 0 || newSelectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

    setFilteredWorks(filtered);
  }, [selectedSchemes, selectedWorkCategories, works, setSelectedSchemes, setFilteredWorks, getAvailableSchemes]);

  // Handle category selection
  const handleCategoryToggle = useCallback((category: string, checked: boolean) => {
    let newSelectedCategories: string[];
    if (checked) {
      newSelectedCategories = [...selectedWorkCategories, category];
    } else {
      newSelectedCategories = selectedWorkCategories.filter(c => c !== category);
    }
    setSelectedWorkCategories(newSelectedCategories);

    // Apply filters
    let filtered = works.filter(w => {
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = newSelectedCategories.length === 0 || newSelectedCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

    setFilteredWorks(filtered);
  }, [selectedSchemes, selectedWorkCategories, works, setSelectedWorkCategories, setFilteredWorks]);

  // Handle select all for schemes
  const handleSelectAllSchemes = useCallback((allSelected: boolean) => {
    const newSelectedSchemes = allSelected ? getAvailableSchemes() : [];
    setSelectedSchemes(newSelectedSchemes);

    let filtered = works.filter(w => {
      const matchesScheme = newSelectedSchemes.length === 0 || newSelectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

    setFilteredWorks(filtered);
  }, [getAvailableSchemes, selectedWorkCategories, works, setSelectedSchemes, setFilteredWorks]);

  // Handle select all for categories
  const handleSelectAllCategories = useCallback((allSelected: boolean) => {
    const newSelectedCategories = allSelected ? getAvailableCategories() : [];
    setSelectedWorkCategories(newSelectedCategories);

    let filtered = works.filter(w => {
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = newSelectedCategories.length === 0 || newSelectedCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

    setFilteredWorks(filtered);
  }, [getAvailableCategories, selectedSchemes, works, setSelectedWorkCategories, setFilteredWorks]);

  // Calculate summary statistics based on selected scheme and category - memoized for performance
  const summaryStats = useMemo(() => {
    const totalWorks = works?.length || 0;
    const completedWorks = works?.filter(w => (w.progress_percentage || 0) === 100).length || 0;
    const inProgressWorks = works?.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100).length || 0;
    const notStartedWorks = works?.filter(w => (w.progress_percentage || 0) === 0).length || 0;
    const blockedWorks = works?.filter(w => w.is_blocked).length || 0;

    return { totalWorks, completedWorks, inProgressWorks, notStartedWorks, blockedWorks };
  }, [works]);

  const handleKPIClick = useCallback((type: 'completed' | 'in_progress' | 'not_started' | 'blocked' | 'all') => {
    // Update active KPI then re-apply filters on top of the current historical base
    setActiveKPI(type);
    // Recompute using the current base dataset (respecting selected date and progress logs)
    const base = getHistoricalProgress;
    const applied = applyFilters(base);

    // Finally apply the KPI filter on the already-applied filters
    let final = applied;
    switch (type) {
      case 'completed':
        final = final.filter(w => (w.progress_percentage || 0) === 100);
        break;
      case 'in_progress':
        final = final.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100);
        break;
      case 'not_started':
        final = final.filter(w => (w.progress_percentage || 0) === 0);
        break;
      case 'blocked':
        final = final.filter(w => !!w.is_blocked);
        break;
      default:
        break;
    }

    setFilteredWorks(final);
    setCurrentPage(1);
  }, [works, selectedSchemes, selectedWorkCategories]);

  // Calculate paginated data with blocked works shown first
  const paginatedData = useMemo(() => {
    // Sort blocked works to the top
    const sortedWorks = [...filteredWorks].sort((a, b) => {
      // First sort by blocked status (blocked works first)
      if (a.is_blocked && !b.is_blocked) return -1;
      if (!a.is_blocked && b.is_blocked) return 1;
      
      // Then maintain the current sort order for non-blocked works
      if (sort.column) {
        const aVal = a[sort.column as keyof Work];
        const bVal = b[sort.column as keyof Work];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return sort.direction === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
      }
      
      return 0;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedWorks.slice(startIndex, endIndex);
  }, [filteredWorks, currentPage, itemsPerPage, sort.column, sort.direction]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Page Header with Scheme Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Progress Dashboard</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
              Overview of all works assigned to you. Your role: <Badge variant="outline" className="ml-1 text-xs">{profile.role}</Badge>
            </p>
          </div>
        </div>


      </div>




      {/* KPI Summary Cards - Ultra Compact Mobile Version */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4">
        <Card
          className={`border-slate-200 shadow-sm cursor-pointer transition-all ${activeKPI === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-sm'} rounded-lg`}
          onClick={() => handleKPIClick('all')}
        >
          <CardContent className="p-1.5 sm:p-2 lg:p-4">
            <div className="text-[10px] sm:text-xs text-slate-600 leading-tight">Total Works</div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 leading-tight">{summaryStats.totalWorks}</div>
          </CardContent>
        </Card>
        <Card
          className={`border-slate-200 shadow-sm cursor-pointer transition-all ${activeKPI === 'completed' ? 'ring-2 ring-green-500' : 'hover:shadow-sm'} rounded-lg`}
          onClick={() => handleKPIClick('completed')}
        >
          <CardContent className="p-1.5 sm:p-2 lg:p-4">
            <div className="text-[10px] sm:text-xs text-slate-600 leading-tight">Completed</div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-green-600 leading-tight">{summaryStats.completedWorks}</div>
          </CardContent>
        </Card>
        <Card
          className={`border-slate-200 shadow-sm cursor-pointer transition-all ${activeKPI === 'in_progress' ? 'ring-2 ring-blue-500' : 'hover:shadow-sm'} rounded-lg`}
          onClick={() => handleKPIClick('in_progress')}
        >
          <CardContent className="p-1.5 sm:p-2 lg:p-4">
            <div className="text-[10px] sm:text-xs text-slate-600 leading-tight">In Progress</div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-blue-600 leading-tight">{summaryStats.inProgressWorks}</div>
          </CardContent>
        </Card>
        <Card
          className={`border-slate-200 shadow-sm cursor-pointer transition-all ${activeKPI === 'not_started' ? 'ring-2 ring-orange-500' : 'hover:shadow-md'} rounded-lg`}
          onClick={() => handleKPIClick('not_started')}
        >
          <CardContent className="p-1.5 sm:p-2 lg:p-4">
            <div className="text-[10px] sm:text-xs text-slate-600 leading-tight">Not Started</div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-orange-600 leading-tight">{summaryStats.notStartedWorks}</div>
          </CardContent>
        </Card>
        <Card
          className={`border-slate-200 shadow-sm cursor-pointer transition-all ${activeKPI === 'blocked' ? 'ring-2 ring-red-500' : 'hover:shadow-md'} rounded-lg`}
          onClick={() => handleKPIClick('blocked')}
        >
          <CardContent className="p-1.5 sm:p-2 lg:p-4">
            <div className="text-[10px] sm:text-xs text-slate-600 leading-tight">Blocked</div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-red-600 leading-tight">{summaryStats.blockedWorks}</div>
          </CardContent>
        </Card>
      </div>


      {/* Works Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 p-3 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Works Overview</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Detailed list of all works assigned to you ({filteredWorks.length} works)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[300px] sm:min-w-[400px]">
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead
                    className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[150px] sm:min-w-[180px]"
                    onClick={() => handleSort('work_name')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">Name of Work</span>
                      {getSortIcon('work_name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none w-[80px] sm:w-[100px]"
                    onClick={() => handleSort('district_name')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">District</span>
                      {getSortIcon('district_name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none w-[90px] sm:w-[110px]"
                    onClick={() => handleSort('progress_percentage')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs sm:text-sm">Progress</span>
                      {getSortIcon('progress_percentage')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors select-none min-w-[120px] sm:min-w-[150px]"
                    onClick={() => handleSort('last_remarks')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">Last Progress Remarks</span>
                      {getSortIcon('last_remarks')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData && paginatedData.length > 0 ? (
                  paginatedData.map((work: Work) => (
                    <TableRow key={work.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="min-w-[150px] sm:min-w-[180px]">
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
                            {shouldShowTooltip(work.work_name) && work.work_name && (
                              <Tooltip content={work.work_name} className="tooltip-mobile">
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600 cursor-help flex-shrink-0" />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px] sm:w-[100px]">
                        <span className="text-slate-600 truncate block text-xs sm:text-sm">
                          {work.district_name || 'No district'}
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
                      <TableCell className="min-w-[120px] sm:min-w-[150px]">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 text-xs sm:text-sm line-clamp-2">
                            <span className="truncate block sm:hidden">
                              {truncateRemarks(getLastProgressRemark(work.id), getRemarksTruncationLength(true))}
                            </span>
                            <span className="truncate block hidden sm:block">
                              {truncateRemarks(getLastProgressRemark(work.id), getRemarksTruncationLength(false))}
                            </span>
                          </span>
                          {getLastProgressRemark(work.id) && getLastProgressRemark(work.id) !== 'No remarks' && (
                            <Tooltip content={getLastProgressRemark(work.id)} className="tooltip-mobile max-w-xs sm:max-w-md">
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600 cursor-help flex-shrink-0" />
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-12">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-t border-slate-200 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWorks.length)} of {filteredWorks.length} works
              </div>
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
