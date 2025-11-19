"use client";

import { useState, useCallback } from "react";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportToExcelButton } from "@/components/custom/ExportToExcelButton";

import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, X, Info, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import type { Work } from "@/lib/types";

interface AnalyticsClientProps {
  works: Work[];
  statusData: { name: string; value: number; }[];
  financialData: { name: string; value: number; }[];
  districtData: { name: string; total: number; }[];
  monthlyData: { week: string; total: number; completed: number; completionRate: number; }[];
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
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: '', direction: 'asc' });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
  const [selectedWorkCategories, setSelectedWorkCategories] = useState<string[]>([]);
  const [schemesDropdownOpen, setSchemesDropdownOpen] = useState<boolean>(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState<boolean>(false);

  // Get base works filtered only by selected scheme and category
  const getBaseFilteredWorks = useCallback((): Work[] => {
    return works.filter((w: Work) => {
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });
  }, [works, selectedSchemes, selectedWorkCategories]);

  // Recalculate status data based on filtered works
  // Status distribution should be based on scheme/category filtered works only (not KPI filter)
  const getFilteredStatusData = useCallback(() => {
    const baseWorks = getBaseFilteredWorks();
    return baseWorks.reduce(
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
  }, [getBaseFilteredWorks]);

  // Recalculate financial data based on filtered works
  // Financial progress should consider billed amount (total billing) and agreement amount
  const getFilteredFinancialData = useCallback(() => {    
    const baseWorks = getBaseFilteredWorks();

    const initialData = [
      { name: 'Completed', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Not Started', value: 0 },
    ];

    const result = baseWorks.reduce((acc, work) => {
      const agreementAmount = Number(work.agreement_amount) || 0;
      // Look for billed amount fields - prefer total_billed_amount, then bill_amount_with_tax, then bill_amount
      const billedAmount = Number(
        (work as any).total_billed_amount ?? (work as any).bill_amount_with_tax ?? (work as any).bill_amount ?? 0
      ) || 0;

      // If there's no agreement and no billing, skip
      if (agreementAmount === 0 && billedAmount === 0) return acc;

      // If there's any billed amount, consider it as completed (show total billed as Completed)
      if (billedAmount > 0) {
        acc[0].value += billedAmount;

        // If there's an agreement and billed < agreement, the remaining is still 'In Progress' or 'Not Started'
        if (agreementAmount > 0 && billedAmount < agreementAmount) {
          // Remaining to be billed
          acc[1].value += (agreementAmount - billedAmount);
        }
      } else {
        // billedAmount === 0
        // If there's an agreement amount, it's not billed yet => Not Started
        if (agreementAmount > 0) {
          acc[2].value += agreementAmount;
        }
      }

      return acc;
    }, initialData);

    // Return only non-zero segments
    return result.filter(item => item.value > 0);
  }, [getBaseFilteredWorks]);

  // Recalculate district data based on filtered works
  const getFilteredDistrictData = useCallback(() => {
    const baseWorks = getBaseFilteredWorks();
    const districtCounts = baseWorks.reduce((acc, work) => {
      const district = work.district_name || 'N/A';
      if (!acc[district]) acc[district] = 0;
      acc[district]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(districtCounts)
      .map(name => ({ name, total: districtCounts[name] }))
      .sort((a, b) => b.total - a.total); // Sort by total in descending order
  }, [getBaseFilteredWorks]);

  // Recalculate weekly data based on filtered works
  const getFilteredWeeklyData = useCallback(() => {
    const baseWorks = getBaseFilteredWorks();
    const weeklyTrend = baseWorks.reduce((acc, work) => {
      if (work.created_at) {
        const date = new Date(work.created_at);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // Calculate week number (Sunday as start of week)
        const weekStart = new Date(year, month, day - date.getDay());
        const weekLabel = weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        if (!acc[weekLabel]) acc[weekLabel] = { total: 0, completed: 0 };
        acc[weekLabel].total++;
        if ((work.progress_percentage || 0) === 100) acc[weekLabel].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.keys(weeklyTrend)
      .map(week => ({
        week: week,
        total: weeklyTrend[week].total,
        completed: weeklyTrend[week].completed,
        completionRate: weeklyTrend[week].total > 0 ? (weeklyTrend[week].completed / weeklyTrend[week].total) * 100 : 0
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-12); // Last 12 weeks
  }, [getBaseFilteredWorks]);

  // Recalculate KPIs based on scheme/category filtered works (base set)
  const getFilteredKPIs = useCallback(() => {
    const baseWorks = getBaseFilteredWorks();
    const totalWorks = baseWorks.length;
    const completedWorks = baseWorks.filter((w: Work) => (w.progress_percentage || 0) === 100).length;
    const notStartedWorks = baseWorks.filter((w: Work) => (w.progress_percentage || 0) === 0).length;
    const blockedWorks = baseWorks.filter((w: Work) => w.is_blocked).length;
    const totalAgreementValue = baseWorks.reduce((sum: number, work: Work) => sum + (work.agreement_amount || 0), 0);
    const completedValue = baseWorks.reduce((sum: number, work: Work) => {
      const progress = work.progress_percentage || 0;
      return sum + ((work.agreement_amount || 0) * progress) / 100;
    }, 0);
    const averageProgress = baseWorks.length > 0 
      ? baseWorks.reduce((sum: number, work: Work) => sum + (work.progress_percentage || 0), 0) / baseWorks.length 
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
  }, [getBaseFilteredWorks]);

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

  // Compute displayed works after applying sorting
  const displayedWorks = (() => {
    if (!filteredWorks) return [] as Work[];
    if (!sort.column) return filteredWorks;
    const sorted = [...filteredWorks].sort((a: Work, b: Work) => {
      const aVal = a[sort.column as keyof Work];
      const bVal = b[sort.column as keyof Work];

      // Normalize values
      const normalize = (v: any) => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string') return v.toLowerCase();
        return v;
      };

      const na = normalize(aVal);
      const nb = normalize(bVal);

      if (na < nb) return sort.direction === 'asc' ? -1 : 1;
      if (na > nb) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  })();

  const handleSort = (column: string) => {
    setSort(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
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
  const handleSchemeToggle = useCallback((scheme: string, checked: boolean) => {
    let newSelectedSchemes: string[];
    if (checked) {
      newSelectedSchemes = [...selectedSchemes, scheme];
    } else {
      newSelectedSchemes = selectedSchemes.filter(s => s !== scheme);
    }
    setSelectedSchemes(newSelectedSchemes);

    // Apply filters
    let filtered = works.filter(w => {
      const matchesScheme = newSelectedSchemes.length === 0 || newSelectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

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
  }, [selectedSchemes, selectedWorkCategories, works, activeFilter, setSelectedSchemes, setFilteredWorks]);

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
  }, [selectedSchemes, selectedWorkCategories, works, activeFilter, setSelectedWorkCategories, setFilteredWorks]);

  // Handle select all for schemes
  const handleSelectAllSchemes = useCallback((allSelected: boolean) => {
    const newSelectedSchemes = allSelected ? getAvailableSchemes() : [];
    setSelectedSchemes(newSelectedSchemes);

    let filtered = works.filter(w => {
      const matchesScheme = newSelectedSchemes.length === 0 || newSelectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

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
  }, [getAvailableSchemes, selectedWorkCategories, works, activeFilter, setSelectedSchemes, setFilteredWorks]);

  // Handle select all for categories
  const handleSelectAllCategories = useCallback((allSelected: boolean) => {
    const newSelectedCategories = allSelected ? getAvailableCategories() : [];
    setSelectedWorkCategories(newSelectedCategories);

    let filtered = works.filter(w => {
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = newSelectedCategories.length === 0 || newSelectedCategories.includes(w.work_category || '');
      return matchesScheme && matchesCategory;
    });

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
  }, [getAvailableCategories, selectedSchemes, works, activeFilter, setSelectedWorkCategories, setFilteredWorks]);

  const handleKPIClick = (filterType: 'all' | 'completed' | 'in_progress' | 'not_started' | 'blocked') => {
    // First get scheme and category filtered works
    let baseWorks = works.filter(w => {
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
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
      const matchesScheme = selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '');
      const matchesCategory = selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '');
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
              <label className="text-sm font-medium text-slate-700 mb-2 block">NAME OF SCHEME</label>
              <DropdownMenu
                open={schemesDropdownOpen}
                onOpenChange={(open) => {
                  // Close dropdown only when explicitly requested or when clicking outside
                  // Don't close on individual item selection due to onSelect event prevention
                  setSchemesDropdownOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[300px] justify-between bg-white border-slate-200 hover:bg-slate-50 text-sm h-11 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span className="truncate">{selectedSchemes.length === 0 ? 'All Schemes' : `${selectedSchemes.length} scheme${selectedSchemes.length === 1 ? '' : 's'} selected`}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto shadow-lg border-slate-200 rounded-lg" align="start">
                  <div className="px-3 py-2 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Select Schemes</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllSchemes(selectedSchemes.length !== getAvailableSchemes().length)}
                        className="text-xs h-7 px-2 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        {selectedSchemes.length === getAvailableSchemes().length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                  <div className="py-1">
                    {getAvailableSchemes().map((scheme) => (
                      <DropdownMenuCheckboxItem
                        key={scheme}
                        checked={selectedSchemes.includes(scheme)}
                        onCheckedChange={(checked) => handleSchemeToggle(scheme, checked)}
                        onSelect={(event) => event.preventDefault()} // Prevent dropdown from closing on individual selection
                        className="cursor-pointer px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded border-2 border-slate-300 bg-white flex items-center justify-center transition-colors ${
                            selectedSchemes.includes(scheme)
                              ? 'bg-blue-500 border-blue-500'
                              : 'hover:border-blue-300'
                          }`}>
                            {selectedSchemes.includes(scheme) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 0-.708.708l3.5 3.5a1.5 1.5 0 0 0 2.112 0l7-7a.5.5 0 0 1 .708 0z"/>
                              </svg>
                            )}
                          </span>
                          <span className="text-sm truncate">{scheme}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
              <span className="font-medium">{selectedSchemes.length === 0 ? 'All Schemes' : `${selectedSchemes.length} scheme${selectedSchemes.length === 1 ? '' : 's'}`}</span>
              <span className="text-slate-400">•</span>
              <span>{works.filter(w => selectedSchemes.length === 0 || selectedSchemes.includes(w.scheme_name || '')).length} works</span>
            </div>
          </div>

          {/* Work Category Selector */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">WORK CATEGORY</label>
              <DropdownMenu
                open={categoriesDropdownOpen}
                onOpenChange={(open) => {
                  // Close dropdown only when explicitly requested or when clicking outside
                  // Don't close on individual item selection due to onSelect event prevention
                  setCategoriesDropdownOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[300px] justify-between bg-white border-slate-200 hover:bg-slate-50 text-sm h-11 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span className="truncate">{selectedWorkCategories.length === 0 ? 'All Categories' : `${selectedWorkCategories.length} categor${selectedWorkCategories.length === 1 ? 'y' : 'ies'} selected`}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto shadow-lg border-slate-200 rounded-lg" align="start">
                  <div className="px-3 py-2 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Select Categories</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllCategories(selectedWorkCategories.length !== getAvailableCategories().length)}
                        className="text-xs h-7 px-2 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        {selectedWorkCategories.length === getAvailableCategories().length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                  <div className="py-1">
                    {getAvailableCategories().map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedWorkCategories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryToggle(category, checked)}
                        onSelect={(event) => event.preventDefault()} // Prevent dropdown from closing on individual selection
                        className="cursor-pointer px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded border-2 border-slate-300 bg-white flex items-center justify-center transition-colors ${
                            selectedWorkCategories.includes(category)
                              ? 'bg-blue-500 border-blue-500'
                              : 'hover:border-blue-300'
                          }`}>
                            {selectedWorkCategories.includes(category) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 0-.708.708l3.5 3.5a1.5 1.5 0 0 0 2.112 0l7-7a.5.5 0 0 1 .708 0z"/>
                              </svg>
                            )}
                          </span>
                          <span className="text-sm truncate">{category}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
              <span className="font-medium">{selectedWorkCategories.length === 0 ? 'All Categories' : `${selectedWorkCategories.length} categor${selectedWorkCategories.length === 1 ? 'y' : 'ies'}`}</span>
              <span className="text-slate-400">•</span>
              <span>{works.filter(w => selectedWorkCategories.length === 0 || selectedWorkCategories.includes(w.work_category || '')).length} works</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <AnalyticsCharts
        statusData={getFilteredStatusData()}
        financialData={getFilteredFinancialData()}
        districtData={getFilteredDistrictData()}
        monthlyData={getFilteredWeeklyData()}
        chartTitle={chartTitle}
        kpis={getFilteredKPIs()}
        colors={colors}
        onKPIClick={handleKPIClick}
        activeFilter={activeFilter}
      />

    </div>
  );
}
