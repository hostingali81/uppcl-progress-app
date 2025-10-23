"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type FilterState = {
  zone: string;
  circle: string;
  status: string;
  search: string;
};

type SortState = {
  column: string;
  direction: 'asc' | 'desc';
};

interface DashboardFiltersProps {
  works: any[];
  userRole: string;
  onFilterChange: (filteredWorks: any[]) => void;
  onSortChange: (sortedWorks: any[]) => void;
}

export function DashboardFilters({ works, userRole, onFilterChange, onSortChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    zone: 'all',
    circle: 'all',
    status: 'all',
    search: ''
  });

  const [sort, setSort] = useState<SortState>({
    column: '',
    direction: 'asc'
  });

  // Get unique values for filter options based on user role
  const getFilterOptions = () => {
    switch (userRole) {
      case 'je':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: []
        };
      case 'sub_division_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: []
        };
      case 'division_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: true,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: [...new Set(works.map(w => w.sub_division_name).filter(Boolean))]
        };
      case 'circle_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: true,
          showSubDivision: false,
          zones: [],
          circles: [],
          divisions: [...new Set(works.map(w => w.division_name).filter(Boolean))],
          subDivisions: []
        };
      case 'zone_head':
        return {
          showZone: false,
          showCircle: true,
          showDivision: false,
          showSubDivision: false,
          zones: [],
          circles: [...new Set(works.map(w => w.circle_name).filter(Boolean))],
          divisions: [],
          subDivisions: []
        };
      case 'superadmin':
        return {
          showZone: true,
          showCircle: true,
          showDivision: true,
          showSubDivision: true,
          zones: [...new Set(works.map(w => w.zone_name).filter(Boolean))],
          circles: [...new Set(works.map(w => w.circle_name).filter(Boolean))],
          divisions: [...new Set(works.map(w => w.division_name).filter(Boolean))],
          subDivisions: [...new Set(works.map(w => w.sub_division_name).filter(Boolean))]
        };
      default:
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: []
        };
    }
  };

  const filterOptions = getFilterOptions();

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters
    let filteredWorks = works;
    
    if (newFilters.zone && newFilters.zone !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.zone_name === newFilters.zone);
    }
    
    if (newFilters.circle && newFilters.circle !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.circle_name === newFilters.circle);
    }
    
    if (newFilters.status && newFilters.status !== 'all') {
      switch (newFilters.status) {
        case 'completed':
          filteredWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 100);
          break;
        case 'in_progress':
          filteredWorks = filteredWorks.filter(w => (w.progress_percentage || 0) > 0 && (w.progress_percentage || 0) < 100);
          break;
        case 'not_started':
          filteredWorks = filteredWorks.filter(w => (w.progress_percentage || 0) === 0);
          break;
        case 'blocked':
          filteredWorks = filteredWorks.filter(w => w.is_blocked);
          break;
      }
    }
    
    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      filteredWorks = filteredWorks.filter(w => 
        w.work_name?.toLowerCase().includes(searchLower) ||
        w.wbs_code?.toLowerCase().includes(searchLower) ||
        w.district_name?.toLowerCase().includes(searchLower)
      );
    }
    
    onFilterChange(filteredWorks);
  };

  const handleSort = (column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sort.column === column && sort.direction === 'asc') {
      newDirection = 'desc';
    }
    
    setSort({ column, direction: newDirection });
    
    const sortedWorks = [...works].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (typeof aVal === 'number') {
        return newDirection === 'asc' ? (aVal - bVal) : (bVal - aVal);
      }
      
      if (aVal < bVal) return newDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    onSortChange(sortedWorks);
  };

  const clearFilters = () => {
    setFilters({ zone: 'all', circle: 'all', status: 'all', search: '' });
    onFilterChange(works);
  };

  const getSortIcon = (column: string) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sort.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by work name, WBS code, or district..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="border-slate-200 hover:bg-slate-50 text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filters:</span>
        </div>
        
        {filterOptions.showZone && (
          <Select value={filters.zone} onValueChange={(value) => handleFilterChange('zone', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Zones</SelectItem>
              {filterOptions.zones.map(zone => (
                <SelectItem key={zone} value={zone} className="bg-white hover:bg-slate-50">{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showCircle && (
          <Select value={filters.circle} onValueChange={(value) => handleFilterChange('circle', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Circles" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Circles</SelectItem>
              {filterOptions.circles.map(circle => (
                <SelectItem key={circle} value={circle} className="bg-white hover:bg-slate-50">{circle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showDivision && (
          <Select value={filters.zone} onValueChange={(value) => handleFilterChange('zone', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Divisions</SelectItem>
              {filterOptions.divisions.map(division => (
                <SelectItem key={division} value={division} className="bg-white hover:bg-slate-50">{division}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showSubDivision && (
          <Select value={filters.circle} onValueChange={(value) => handleFilterChange('circle', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Sub-Divisions" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Sub-Divisions</SelectItem>
              {filterOptions.subDivisions.map(subDivision => (
                <SelectItem key={subDivision} value={subDivision} className="bg-white hover:bg-slate-50">{subDivision}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
            <SelectItem value="all" className="bg-white hover:bg-slate-50">All Status</SelectItem>
            <SelectItem value="completed" className="bg-white hover:bg-slate-50">Completed</SelectItem>
            <SelectItem value="in_progress" className="bg-white hover:bg-slate-50">In Progress</SelectItem>
            <SelectItem value="not_started" className="bg-white hover:bg-slate-50">Not Started</SelectItem>
            <SelectItem value="blocked" className="bg-white hover:bg-slate-50">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Active filters:</span>
          {filters.zone && filters.zone !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Zone: {filters.zone}
            </Badge>
          )}
          {filters.circle && filters.circle !== 'all' && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Circle: {filters.circle}
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              Status: {filters.status.replace('_', ' ')}
            </Badge>
          )}
        </div>
      )}

    </div>
  );
}
