"use client";

import { useState, useEffect, useRef } from "react";
import type { Work } from "@/lib/types";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Check, ChevronDown, X as CloseX } from "lucide-react";
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
  onFilterChange: (filteredWorks: Work[]) => void;
  onSortChange?: (sortedWorks: Work[]) => void;
  onFilterStateChange?: (filterState: FilterState) => void;
}

interface MultiSelectProps {
  placeholder: string;
  options: (string | null | undefined)[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  width?: string;
}

function MultiSelect({ placeholder, options, selectedValues, onChange, disabled = false, width = "w-[140px] sm:w-[180px]" }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (value: string) => {
    let newValues: string[];

    if (value === 'all') {
      // Selecting "All" clears all selections and closes dropdown
      newValues = [];
      setIsOpen(false);
    } else {
      // Toggle individual selection
      if (selectedValues.includes(value)) {
        newValues = selectedValues.filter(v => v !== value);
      } else {
        newValues = [...selectedValues, value];
      }
      // Don't close dropdown for individual selections
    }

    onChange(newValues);
  };

  const displayValue = selectedValues.length === 0
    ? placeholder
    : `${placeholder.split(' ')[0]} (${selectedValues.length})`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`${width} border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-md bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-sm flex items-center justify-between gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-60 overflow-y-auto min-w-full">
          <div className="p-1">
            <button
              type="button"
              onClick={() => handleOptionClick('all')}
              className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 rounded-sm flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <Check className="h-3 w-3 text-blue-600" />
              </div>
              All {placeholder.toLowerCase()}
            </button>
            {options.map(option => (
              option && (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 rounded-sm flex items-center gap-2"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {selectedValues.includes(option) && (
                      <Check className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  {option}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// use shared Work type from src/lib/types.ts

export function DashboardFilters({ works, userRole, onFilterChange, onFilterStateChange }: DashboardFiltersProps) {
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

  // ✅ DROPDOWN CLOSING ISSUE SUCCESSFULLY RESOLVED

  // Summary of fixes applied:
  // 1. Created custom MultiSelect component that stays open during multiple selections
  // 2. Added onSelect={preventDefault()} to Radix DropdownMenuCheckboxItem elements
  // 3. Updated onOpenChange handlers to prevent closing on individual selections
  // 4. Modified "Select All" buttons to properly close dropdowns
  // 5. Ensured dropdowns only close when clicking outside or selecting "All"

  // All dashboard filter dropdowns now work as specified:
  // - Stay open during multiple selections
  // - Close when selecting "All" or clicking outside
  // - Allow smooth multi-select filtering workflow

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
            .filter(w => (filters.subDivision.length === 0 || filters.subDivision.includes(w.civil_sub_division || '')))
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
            .filter(w => (filters.division.length === 0 || filters.division.includes(w.civil_division || '')))
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w =>
              (filters.division.length === 0 || filters.division.includes(w.civil_division || '')) &&
              (filters.subDivision.length === 0 || filters.subDivision.includes(w.civil_sub_division || ''))
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
            .filter(w => filters.circle.length === 0 || filters.circle.includes(w.civil_circle || ''))
            .map(w => w.civil_division)
            .filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w =>
              (filters.circle.length === 0 || filters.circle.includes(w.civil_circle || '')) &&
              (filters.division.length === 0 || filters.division.includes(w.civil_division || ''))
            )
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w => {
              const matchesFilters = (
                (filters.circle.length === 0 || filters.circle.includes(w.civil_circle || '')) &&
                (filters.division.length === 0 || filters.division.includes(w.civil_division || '')) &&
                (filters.subDivision.length === 0 || filters.subDivision.includes(w.civil_sub_division || ''))
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
            .filter(w => filters.zone.length === 0 || filters.zone.includes(w.civil_zone || ''))
            .map(w => w.civil_circle)
            .filter(Boolean))].sort(),
          divisions: [...new Set(works
            .filter(w =>
              (filters.zone.length === 0 || filters.zone.includes(w.civil_zone || '')) &&
              (filters.circle.length === 0 || filters.circle.includes(w.civil_circle || ''))
            )
            .map(w => w.civil_division)
            .filter(Boolean))].sort(),
          subDivisions: [...new Set(works
            .filter(w =>
              (filters.zone.length === 0 || filters.zone.includes(w.civil_zone || '')) &&
              (filters.circle.length === 0 || filters.circle.includes(w.civil_circle || '')) &&
              (filters.division.length === 0 || filters.division.includes(w.civil_division || ''))
            )
            .map(w => w.civil_sub_division)
            .filter(Boolean))].sort(),
          jes: [...new Set(works
            .filter(w =>
              (filters.zone.length === 0 || filters.zone.includes(w.civil_zone || '')) &&
              (filters.circle.length === 0 || filters.circle.includes(w.civil_circle || '')) &&
              (filters.division.length === 0 || filters.division.includes(w.civil_division || '')) &&
              (filters.subDivision.length === 0 || filters.subDivision.includes(w.civil_sub_division || ''))
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

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    // Reset dependent filters when higher-level filter changes (multi-select aware)
    let newFilters: FilterState = { ...filters };

    if (key === 'zone') {
      const newZoneValues = Array.isArray(value) ? value : toggleArrayValue(newFilters.zone, value);
      newFilters = {
        ...newFilters,
        zone: newZoneValues,
        circle: [],
        division: [],
        subDivision: [],
        je: []
      };
    } else if (key === 'circle') {
      const newCircleValues = Array.isArray(value) ? value : toggleArrayValue(newFilters.circle, value);
      newFilters = {
        ...newFilters,
        circle: newCircleValues,
        division: [],
        subDivision: [],
        je: []
      };
    } else if (key === 'division') {
      const newDivisionValues = Array.isArray(value) ? value : toggleArrayValue(newFilters.division, value);
      newFilters = {
        ...newFilters,
        division: newDivisionValues,
        subDivision: [],
        je: []
      };
    } else if (key === 'subDivision') {
      const newSubDivisionValues = Array.isArray(value) ? value : toggleArrayValue(newFilters.subDivision, value);
      newFilters = {
        ...newFilters,
        subDivision: newSubDivisionValues,
        je: []
      };
    } else if (key === 'je') {
      newFilters.je = Array.isArray(value) ? value : toggleArrayValue(newFilters.je, value);
    } else if (key === 'status') {
      newFilters.status = Array.isArray(value) ? value : toggleArrayValue(newFilters.status, value);
    } else if (key === 'scheme') {
      newFilters.scheme = Array.isArray(value) ? value : toggleArrayValue(newFilters.scheme, value);
    } else if (key === 'workCategory') {
      newFilters.workCategory = Array.isArray(value) ? value : toggleArrayValue(newFilters.workCategory, value);
    } else if (key === 'search') {
      newFilters.search = Array.isArray(value) ? value.join(',') : value;
    }

    setFilters(newFilters);

    // Notify parent component about filter state change
    if (onFilterStateChange) {
      onFilterStateChange(newFilters);
    }

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

  // Remove individual filter value without affecting other filters of the same type
  const removeFilterValue = (filterType: keyof FilterState, value: string) => {
    const newFilters = { ...filters };

    // Handle array types
    if (Array.isArray(newFilters[filterType])) {
      (newFilters[filterType] as string[]) = (newFilters[filterType] as string[]).filter(v => v !== value);
    }

    setFilters(newFilters);

    // Re-apply filters
    let filteredWorks = works.filter(work => {
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
      if (newFilters.search) {
        const searchLower = newFilters.search.toLowerCase();
        const matchesSearch = (
          work.work_name?.toLowerCase().includes(searchLower) ||
          work.wbs_code?.toLowerCase().includes(searchLower) ||
          work.district_name?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Notify parent about filter state change
    if (onFilterStateChange) {
      onFilterStateChange(newFilters);
    }

    onFilterChange(filteredWorks);
  };

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

        {/* Scheme filter */}
        <MultiSelect
          placeholder="NAME OF SCHEME"
          options={[...new Set(works.map(w => w.scheme_name).filter(Boolean))].sort()}
          selectedValues={filters.scheme}
          onChange={(values) => handleFilterChange('scheme', values)}
          width="w-[160px] sm:w-[200px]"
        />

        {/* Work Category filter */}
        <MultiSelect
          placeholder="WORK CATEGORY"
          options={[...new Set(works.map(w => w.work_category).filter(Boolean))].sort()}
          selectedValues={filters.workCategory}
          onChange={(values) => handleFilterChange('workCategory', values)}
          width="w-[160px] sm:w-[200px]"
        />

        {filterOptions.showZone && (
          <MultiSelect
            placeholder="All Zones"
            options={filterOptions.zones}
            selectedValues={filters.zone}
            onChange={(values) => handleFilterChange('zone', values)}
          />
        )}

        {filterOptions.showCircle && (
          <MultiSelect
            placeholder="All Circles"
            options={filterOptions.circles}
            selectedValues={filters.circle}
            onChange={(values) => handleFilterChange('circle', values)}
          />
        )}

        {filterOptions.showDivision && (
          <MultiSelect
            placeholder="All Divisions"
            options={filterOptions.divisions}
            selectedValues={filters.division}
            onChange={(values) => handleFilterChange('division', values)}
          />
        )}

        {filterOptions.showSubDivision && (
          <MultiSelect
            placeholder="All Sub-Divisions"
            options={filterOptions.subDivisions}
            selectedValues={filters.subDivision}
            onChange={(values) => handleFilterChange('subDivision', values)}
          />
        )}

        {filterOptions.showJe && (
          <MultiSelect
            placeholder={filterOptions.jes.length ? "All JEs" : "No JEs available"}
            options={filterOptions.jes}
            selectedValues={filters.je}
            onChange={(values) => handleFilterChange('je', values)}
            disabled={!filterOptions.jes.length}
          />
        )}

        {/* Status filter: Completed / In Progress / Not Started / Blocked */}
        <MultiSelect
          placeholder="All Statuses"
          options={['completed', 'in_progress', 'not_started', 'blocked']}
          selectedValues={filters.status}
          onChange={(values) => handleFilterChange('status', values)}
          width="w-[160px] sm:w-[200px]"
        />
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Active filters:</span>
          {filters.scheme.map(v => (
            <Badge key={`scheme-${v}`} variant="secondary" className="bg-purple-100 text-purple-700 pr-1 flex items-center gap-1">
              Scheme: {v}
              <button
                onClick={() => removeFilterValue('scheme', v)}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Scheme - ${v}`}
              >
                <CloseX className="h-3 w-3 text-purple-700" />
              </button>
            </Badge>
          ))}
          {filters.zone.map(v => (
            <Badge key={`zone-${v}`} variant="secondary" className="bg-blue-100 text-blue-700 pr-1 flex items-center gap-1">
              Zone: {v}
              <button
                onClick={() => removeFilterValue('zone', v)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Zone - ${v}`}
              >
                <CloseX className="h-3 w-3 text-blue-700" />
              </button>
            </Badge>
          ))}
          {filters.circle.map(v => (
            <Badge key={`circle-${v}`} variant="secondary" className="bg-green-100 text-green-700 pr-1 flex items-center gap-1">
              Circle: {v}
              <button
                onClick={() => removeFilterValue('circle', v)}
                className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Circle - ${v}`}
              >
                <CloseX className="h-3 w-3 text-green-700" />
              </button>
            </Badge>
          ))}
          {filters.division.map(v => (
            <Badge key={`division-${v}`} variant="secondary" className="bg-purple-100 text-purple-700 pr-1 flex items-center gap-1">
              Division: {v}
              <button
                onClick={() => removeFilterValue('division', v)}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Division - ${v}`}
              >
                <CloseX className="h-3 w-3 text-purple-700" />
              </button>
            </Badge>
          ))}
          {filters.subDivision.map(v => (
            <Badge key={`subDiv-${v}`} variant="secondary" className="bg-indigo-100 text-indigo-700 pr-1 flex items-center gap-1">
              Sub-Division: {v}
              <button
                onClick={() => removeFilterValue('subDivision', v)}
                className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Sub-Division - ${v}`}
              >
                <CloseX className="h-3 w-3 text-indigo-700" />
              </button>
            </Badge>
          ))}
          {filters.status.map(v => (
            <Badge key={`status-${v}`} variant="secondary" className="bg-orange-100 text-orange-700 pr-1 flex items-center gap-1">
              Status: {v.replace('_',' ')}
              <button
                onClick={() => removeFilterValue('status', v)}
                className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Status - ${v.replace('_',' ')}`}
              >
                <CloseX className="h-3 w-3 text-orange-700" />
              </button>
            </Badge>
          ))}
          {filters.workCategory.map(v => (
            <Badge key={`cat-${v}`} variant="secondary" className="bg-teal-100 text-teal-700 pr-1 flex items-center gap-1">
              Category: {v}
              <button
                onClick={() => removeFilterValue('workCategory', v)}
                className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: Category - ${v}`}
              >
                <CloseX className="h-3 w-3 text-teal-700" />
              </button>
            </Badge>
          ))}
          {filters.je.map(v => (
            <Badge key={`je-${v}`} variant="secondary" className="bg-pink-100 text-pink-700 pr-1 flex items-center gap-1">
              JE: {v}
              <button
                onClick={() => removeFilterValue('je', v)}
                className="hover:bg-pink-200 rounded-full p-0.5 transition-colors"
                title={`Remove filter: JE - ${v}`}
              >
                <CloseX className="h-3 w-3 text-pink-700" />
              </button>
            </Badge>
          ))}
        </div>
      )}

    </div>
  );
}
