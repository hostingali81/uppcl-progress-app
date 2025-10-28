"use client";

import { useState, useEffect } from "react";
import type { Work } from "@/lib/types";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type FilterState = {
  zone: string;
  circle: string;
  division: string;
  subDivision: string;
  je: string;
  status: string;
  search: string;
  scheme: string;
  workCategory: string;
};


interface DashboardFiltersProps {
  works: Work[];
  userRole: string;
  selectedScheme: string;
  selectedWorkCategory: string;
  onFilterChange: (filteredWorks: Work[]) => void;
  onSortChange?: (sortedWorks: Work[]) => void;
}


// use shared Work type from src/lib/types.ts

export function DashboardFilters({ works, userRole, selectedScheme, onFilterChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    zone: 'all',
    circle: 'all',
    division: 'all',
    subDivision: 'all',
    je: 'all',
    status: 'all',
    search: '',
    scheme: 'all',
    workCategory: 'all'
  });

  // Debounce search input to avoid excessive filtering
  const debouncedSearch = useDebounce(filters.search, 300);

  // Apply filters when debounced search changes
  useEffect(() => {
    handleFilterChange('search', debouncedSearch);
  }, [debouncedSearch]);

  // Removed unused sort state

  // Get unique values for filter options based on user role
  const getFilterOptions = () => {
    switch (userRole) {
      case 'je':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          showJe: false,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: [],
          jes: []
        };
      case 'sub_division_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          showJe: true,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: [],
          jes: [...new Set(works.map(w => w.je_name).filter(Boolean))].sort()
        };
      case 'division_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: true,
          showJe: true,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: [...new Set(works.map(w => w.sub_division_name).filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => filters.subDivision === 'all' ? false : w.sub_division_name === filters.subDivision)
            .map(w => w.je_name)
            .filter(Boolean))].sort()
        };
      case 'circle_head':
        return {
          showZone: false,
          showCircle: false,
          showDivision: true,
          showSubDivision: true,
          showJe: true,
          zones: [],
          circles: [],
          divisions: [...new Set(works.map(w => w.division_name).filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w => filters.division === 'all' ? false : w.division_name === filters.division)
            .map(w => w.sub_division_name)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => 
              (filters.division !== 'all' && w.division_name === filters.division) &&
              (filters.subDivision === 'all' ? false : w.sub_division_name === filters.subDivision)
            )
            .map(w => w.je_name)
            .filter(Boolean))].sort()
        };
      case 'zone_head':
        return {
          showZone: false,
          showCircle: true,
          showDivision: true,
          showSubDivision: true,
          showJe: true,
          zones: [],
          circles: [...new Set(works.map(w => w.circle_name).filter(Boolean))].sort(),
          // For zone_head, populate divisions from works in the current zone (works is likely already zone-filtered),
          // but still narrow down when a circle is selected.
          divisions: [...new Set(works
            .filter(w => (filters.circle === 'all' ? true : w.circle_name === filters.circle))
            .map(w => w.division_name)
            .filter(Boolean))].sort(),
          // Sub-divisions should consider both circle and division selections when present.
          subDivisions: [...new Set(works
            .filter(w => 
              (filters.circle === 'all' ? true : w.circle_name === filters.circle) &&
              (filters.division === 'all' ? true : w.division_name === filters.division)
            )
            .map(w => w.sub_division_name)
            .filter(Boolean))].sort(),
          // JEs should be shown based on all higher-level selections when provided.
          jes: [...new Set(works
            .filter(w => 
              (filters.circle === 'all' ? true : w.circle_name === filters.circle) &&
              (filters.division === 'all' ? true : w.division_name === filters.division) &&
              (filters.subDivision === 'all' ? true : w.sub_division_name === filters.subDivision)
            )
            .map(w => w.je_name)
            .filter(Boolean))].sort()
        };
      case 'superadmin':
        return {
          showZone: true,
          showCircle: true,
          showDivision: true,
          showSubDivision: true,
          showJe: true,
          zones: [...new Set(works.map(w => w.zone_name).filter(Boolean))].sort(),
          circles: [...new Set(works
            .filter(w => filters.zone === 'all' ? false : w.zone_name === filters.zone)
            .map(w => w.circle_name)
            .filter(Boolean))].sort(),
          divisions: [...new Set(works
            .filter(w => 
              (filters.zone !== 'all' && w.zone_name === filters.zone) &&
              (filters.circle === 'all' ? false : w.circle_name === filters.circle)
            )
            .map(w => w.division_name)
            .filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w => 
              (filters.zone !== 'all' && w.zone_name === filters.zone) &&
              (filters.circle !== 'all' && w.circle_name === filters.circle) &&
              (filters.division === 'all' ? false : w.division_name === filters.division)
            )
            .map(w => w.sub_division_name)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => 
              (filters.zone !== 'all' && w.zone_name === filters.zone) &&
              (filters.circle !== 'all' && w.circle_name === filters.circle) &&
              (filters.division !== 'all' && w.division_name === filters.division) &&
              (filters.subDivision === 'all' ? false : w.sub_division_name === filters.subDivision)
            )
            .map(w => w.je_name)
            .filter(Boolean))].sort()
        };
      default:
        return {
          showZone: false,
          showCircle: false,
          showDivision: false,
          showSubDivision: false,
          showJe: false,
          zones: [],
          circles: [],
          divisions: [],
          subDivisions: [],
          jes: []
        };
    }
  };

  const filterOptions = getFilterOptions();

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    // Reset dependent filters when higher-level filter changes
    let newFilters = { ...filters };
    
    if (key === 'zone') {
      newFilters = {
        ...newFilters,
        zone: value,
        circle: 'all',
        division: 'all',
        subDivision: 'all',
        je: 'all'
      };
    } else if (key === 'circle') {
      newFilters = {
        ...newFilters,
        circle: value,
        division: 'all',
        subDivision: 'all',
        je: 'all'
      };
    } else if (key === 'division') {
      newFilters = {
        ...newFilters,
        division: value,
        subDivision: 'all',
        je: 'all'
      };
    } else if (key === 'subDivision') {
      newFilters = {
        ...newFilters,
        subDivision: value,
        je: 'all'
      };
    } else {
      newFilters[key] = value;
    }
    
    setFilters(newFilters);
    
    // Apply filters
    let filteredWorks = works;
    
    if (newFilters.scheme && newFilters.scheme !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.scheme_name === newFilters.scheme);
    }

    if (newFilters.workCategory && newFilters.workCategory !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.work_category === newFilters.workCategory);
    }
    
    if (newFilters.zone && newFilters.zone !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.zone_name === newFilters.zone);
    }
    
    if (newFilters.circle && newFilters.circle !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.circle_name === newFilters.circle);
    }
    
    if (newFilters.division && newFilters.division !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.division_name === newFilters.division);
    }
    
    if (newFilters.subDivision && newFilters.subDivision !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.sub_division_name === newFilters.subDivision);
    }

    if (newFilters.je && newFilters.je !== 'all') {
      filteredWorks = filteredWorks.filter(w => w.je_name === newFilters.je);
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
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filteredWorks = filteredWorks.filter(w => 
        w.work_name?.toLowerCase().includes(searchLower) ||
        w.wbs_code?.toLowerCase().includes(searchLower) ||
        w.district_name?.toLowerCase().includes(searchLower)
      );
    }
    
    onFilterChange(filteredWorks);
  };

  const clearFilters = () => {
    setFilters({ 
      zone: 'all', 
      circle: 'all', 
      division: 'all', 
      subDivision: 'all',
      je: 'all', 
      status: 'all', 
      search: '', 
      scheme: 'all',
      workCategory: 'all'
    });
    onFilterChange(works);
  };

  // Unused functions removed

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by work name, WBS code, or district..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        {activeFiltersCount > 0 && (
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="border-slate-200 hover:bg-slate-50 text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Clear ({activeFiltersCount})
          </EnhancedButton>
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
                <SelectItem key={zone ?? 'unknown-zone'} value={zone ?? ''} className="bg-white hover:bg-slate-50">{zone || 'Unknown'}</SelectItem>
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
                <SelectItem key={circle ?? 'unknown-circle'} value={circle ?? ''} className="bg-white hover:bg-slate-50">{circle || 'Unknown'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showDivision && (
          <Select value={filters.division} onValueChange={(value) => handleFilterChange('division', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Divisions</SelectItem>
              {filterOptions.divisions.map(division => (
                <SelectItem key={division ?? 'unknown-division'} value={division ?? ''} className="bg-white hover:bg-slate-50">{division || 'Unknown'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showSubDivision && (
          <Select value={filters.subDivision} onValueChange={(value) => handleFilterChange('subDivision', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All Sub-Divisions" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All Sub-Divisions</SelectItem>
              {filterOptions.subDivisions.map(subDivision => (
                <SelectItem key={subDivision ?? 'unknown-subdivision'} value={subDivision ?? ''} className="bg-white hover:bg-slate-50">{subDivision || 'Unknown'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.showJe && (
          <Select value={filters.je} onValueChange={(value) => handleFilterChange('je', value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="All JEs" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All JEs</SelectItem>
              {filterOptions.jes
                .filter(je => {
                  const work = works.find(w => w.je_name === je);
                  return (
                    (filters.subDivision === 'all' || work?.sub_division_name === filters.subDivision) &&
                    (filters.division === 'all' || work?.division_name === filters.division) &&
                    (filters.circle === 'all' || work?.circle_name === filters.circle) &&
                    (filters.zone === 'all' || work?.zone_name === filters.zone)
                  );
                })
                .map(je => (
                  <SelectItem key={je} value={je || ''} className="bg-white hover:bg-slate-50">{je || 'Unknown'}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Active filters:</span>
          {filters.scheme && filters.scheme !== 'all' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Scheme: {filters.scheme}
            </Badge>
          )}
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
          {filters.division && filters.division !== 'all' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Division: {filters.division}
            </Badge>
          )}
          {filters.subDivision && filters.subDivision !== 'all' && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
              Sub-Division: {filters.subDivision}
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              Status: {filters.status.replace('_', ' ')}
            </Badge>
          )}
          {filters.workCategory && filters.workCategory !== 'all' && (
            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
              Category: {filters.workCategory}
            </Badge>
          )}
        </div>
      )}

    </div>
  );
}
