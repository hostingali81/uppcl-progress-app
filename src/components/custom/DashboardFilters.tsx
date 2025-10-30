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
  zone: string[];
  circle: string[];
  division: string[];
  subDivision: string[];
  je: string[];
  status: string[];
  search: string;
  scheme: string[];
  workCategory: string[];
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
    zone: [],
    circle: [],
    division: [],
    subDivision: [],
    je: [],
    status: [],
    search: '',
    scheme: [],
    workCategory: []
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
          subDivisions: [...new Set(works.map(w => w.civil_sub_division).filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => (filters.subDivision === 'all' || w.civil_sub_division === filters.subDivision))
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
          divisions: [...new Set(works.map(w => w.civil_division).filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w => (filters.division === 'all' || w.civil_division === filters.division))
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => 
              (filters.division === 'all' || w.civil_division === filters.division) &&
              (filters.subDivision === 'all' || w.civil_sub_division === filters.subDivision)
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
          circles: [...new Set(works.map(w => w.civil_circle).filter(Boolean))].sort(),
          divisions: [...new Set(works
            .filter(w => filters.circle === 'all' || w.civil_circle === filters.circle)
            .map(w => w.civil_division)
            .filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w => 
              (filters.circle === 'all' || w.civil_circle === filters.circle) &&
              (filters.division === 'all' || w.civil_division === filters.division)
            )
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => {
              const matchesFilters = (
                (filters.circle === 'all' || w.civil_circle === filters.circle) &&
                (filters.division === 'all' || w.civil_division === filters.division) &&
                (filters.subDivision === 'all' || w.civil_sub_division === filters.subDivision)
              );
              return matchesFilters && w.je_name; // Only include if JE name exists
            })
            .map(w => w.je_name!)
            .filter(Boolean))].sort()
        };
      case 'superadmin':
        return {
          showZone: true,
          showCircle: true,
          showDivision: true,
          showSubDivision: true,
          showJe: true,
          zones: [...new Set(works.map(w => w.civil_zone).filter(Boolean))].sort(),
          circles: [...new Set(works
            .filter(w => filters.zone === 'all' || w.civil_zone === filters.zone)
            .map(w => w.civil_circle)
            .filter(Boolean))].sort(),
          divisions: [...new Set(works
            .filter(w => 
              (filters.zone === 'all' || w.civil_zone === filters.zone) &&
              (filters.circle === 'all' || w.civil_circle === filters.circle)
            )
            .map(w => w.civil_division)
            .filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w => 
              (filters.zone === 'all' || w.civil_zone === filters.zone) &&
              (filters.circle === 'all' || w.civil_circle === filters.circle) &&
              (filters.division === 'all' || w.civil_division === filters.division)
            )
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => 
              (filters.zone === 'all' || w.civil_zone === filters.zone) &&
              (filters.circle === 'all' || w.civil_circle === filters.circle) &&
              (filters.division === 'all' || w.civil_division === filters.division) &&
              (filters.subDivision === 'all' || w.civil_sub_division === filters.subDivision)
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

  const toggleArrayValue = (arr: string[], value: string): string[] => {
    if (value === 'all') return [];
    if (!value) return arr;
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    // Reset dependent filters when higher-level filter changes (multi-select aware)
    let newFilters: FilterState = { ...filters };

    if (key === 'zone') {
      newFilters = {
        ...newFilters,
        zone: toggleArrayValue(newFilters.zone, value),
        circle: [],
        division: [],
        subDivision: [],
        je: []
      };
    } else if (key === 'circle') {
      newFilters = {
        ...newFilters,
        circle: toggleArrayValue(newFilters.circle, value),
        division: [],
        subDivision: [],
        je: []
      };
    } else if (key === 'division') {
      newFilters = {
        ...newFilters,
        division: toggleArrayValue(newFilters.division, value),
        subDivision: [],
        je: []
      };
    } else if (key === 'subDivision') {
      newFilters = {
        ...newFilters,
        subDivision: toggleArrayValue(newFilters.subDivision, value),
        je: []
      };
    } else if (key === 'je') {
      newFilters.je = toggleArrayValue(newFilters.je, value);
    } else if (key === 'status') {
      newFilters.status = toggleArrayValue(newFilters.status, value);
    } else if (key === 'scheme') {
      newFilters.scheme = toggleArrayValue(newFilters.scheme, value);
    } else if (key === 'workCategory') {
      newFilters.workCategory = toggleArrayValue(newFilters.workCategory, value);
    } else if (key === 'search') {
      newFilters.search = value;
    }

    setFilters(newFilters);

    // Apply filters
    let filteredWorks = works.filter(work => {
      // Basic filters
      const passesBasicFilters = (
        (newFilters.scheme.length === 0 || newFilters.scheme.includes(work.scheme_name || '')) &&
        (newFilters.workCategory.length === 0 || newFilters.workCategory.includes(work.work_category || '')) &&
        (newFilters.zone.length === 0 || newFilters.zone.includes(work.civil_zone || '')) &&
        (newFilters.circle.length === 0 || newFilters.circle.includes(work.civil_circle || '')) &&
        (newFilters.division.length === 0 || newFilters.division.includes(work.civil_division || '')) &&
        (newFilters.subDivision.length === 0 || newFilters.subDivision.includes(work.civil_sub_division || '')) &&
        (newFilters.je.length === 0 || newFilters.je.includes(work.je_name || ''))
      );

      if (!passesBasicFilters) return false;

      // Status filter
      if (newFilters.status && newFilters.status.length > 0) {
        const progress = work.progress_percentage || 0;
        const matchesAnyStatus = newFilters.status.some(st => {
          if (st === 'completed') return progress === 100;
          if (st === 'in_progress') return progress > 0 && progress < 100;
          if (st === 'not_started') return progress === 0;
          if (st === 'blocked') return !!work.is_blocked;
          return true;
        });
        if (!matchesAnyStatus) return false;
      }

      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = (
          work.work_name?.toLowerCase().includes(searchLower) ||
          work.wbs_code?.toLowerCase().includes(searchLower) ||
          work.district_name?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });    onFilterChange(filteredWorks);
  };

  const clearFilters = () => {
    setFilters({ 
      zone: [], 
      circle: [], 
      division: [], 
      subDivision: [],
      je: [], 
      status: [], 
      search: '', 
      scheme: [],
      workCategory: []
    });
    onFilterChange(works);
  };

  // Unused functions removed

  const activeFiltersCount = [
    ...filters.zone,
    ...filters.circle,
    ...filters.division,
    ...filters.subDivision,
    ...filters.je,
    ...filters.status,
    ...filters.scheme,
    ...filters.workCategory
  ].filter(Boolean).length + (filters.search ? 1 : 0);

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
          <Select value={""} onValueChange={(value) => handleFilterChange('zone', value)}>
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
          <Select value={""} onValueChange={(value) => handleFilterChange('circle', value)}>
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
          <Select value={""} onValueChange={(value) => handleFilterChange('division', value)}>
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
          <Select value={""} onValueChange={(value) => handleFilterChange('subDivision', value)}>
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
          <Select 
            value={""} 
            onValueChange={(value) => handleFilterChange('je', value)}
            disabled={!filterOptions.jes.length}
          >
            <SelectTrigger 
              className={`w-[140px] sm:w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm ${
                !filterOptions.jes.length ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <SelectValue placeholder={filterOptions.jes.length ? "All JEs" : "No JEs available"} />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="bg-white hover:bg-slate-50">All JEs</SelectItem>
              {filterOptions.jes
                .sort((a, b) => (a || '').localeCompare(b || ''))
                .map(je => (
                  <SelectItem 
                    key={je ?? ''} 
                    value={je ?? ''} 
                    className="bg-white hover:bg-slate-50"
                  >
                    {je ?? 'Unknown'}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        )}
        {/* Status filter: Completed / In Progress / Not Started / Blocked */}
        <Select value={""} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[160px] sm:w-[200px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white border-slate-200 shadow-lg">
            <SelectItem value="all" className="bg-white hover:bg-slate-50">All Statuses</SelectItem>
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
          {filters.scheme.map(v => (
            <Badge key={`scheme-${v}`} variant="secondary" className="bg-purple-100 text-purple-700">Scheme: {v}</Badge>
          ))}
          {filters.zone.map(v => (
            <Badge key={`zone-${v}`} variant="secondary" className="bg-blue-100 text-blue-700">Zone: {v}</Badge>
          ))}
          {filters.circle.map(v => (
            <Badge key={`circle-${v}`} variant="secondary" className="bg-green-100 text-green-700">Circle: {v}</Badge>
          ))}
          {filters.division.map(v => (
            <Badge key={`division-${v}`} variant="secondary" className="bg-purple-100 text-purple-700">Division: {v}</Badge>
          ))}
          {filters.subDivision.map(v => (
            <Badge key={`subDiv-${v}`} variant="secondary" className="bg-indigo-100 text-indigo-700">Sub-Division: {v}</Badge>
          ))}
          {filters.status.map(v => (
            <Badge key={`status-${v}`} variant="secondary" className="bg-orange-100 text-orange-700">Status: {v.replace('_',' ')}</Badge>
          ))}
          {filters.workCategory.map(v => (
            <Badge key={`cat-${v}`} variant="secondary" className="bg-teal-100 text-teal-700">Category: {v}</Badge>
          ))}
        </div>
      )}

    </div>
  );
}
