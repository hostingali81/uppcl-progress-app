"use client";

import { useMemo, Fragment, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Work } from "@/lib/types";
import { Settings2, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface DynamicSummaryReportProps {
  works: Work[];
}

// Available grouping fields
const GROUPING_OPTIONS = [
  { value: 'civil_zone', label: 'Civil Zone' },
  { value: 'civil_circle', label: 'Civil Circle' },
  { value: 'civil_division', label: 'Civil Division' },
  { value: 'civil_sub_division', label: 'Civil Sub-Division' },
  { value: 'distribution_zone', label: 'Distribution Zone' },
  { value: 'distribution_circle', label: 'Distribution Circle' },
  { value: 'distribution_division', label: 'Distribution Division' },
  { value: 'distribution_sub_division', label: 'Distribution Sub-Division' },
  { value: 'work_category', label: 'Work Category' },
  { value: 'scheme_name', label: 'Scheme Name' },
  { value: 'district_name', label: 'District' },
  { value: 'je_name', label: 'JE Name' },
  { value: 'mb_status', label: 'MB Status' },
  { value: 'teco_status', label: 'TECO Status' },
  { value: 'fico_status', label: 'FICO Status' },
];

// Available metrics
const METRIC_OPTIONS = [
  { value: 'count', label: 'Total Works Count', type: 'count' },
  { value: 'nitPublished', label: 'NIT Published', type: 'count' },
  { value: 'tender', label: 'Tender Count', type: 'count' },
  { value: 'part1', label: 'Part-1 Opening', type: 'count' },
  { value: 'part2', label: 'Part-2 Opening', type: 'count' },
  { value: 'loi', label: 'LOI Issued', type: 'count' },
  { value: 'agreementSigned', label: 'Agreement Signed', type: 'count' },
  { value: 'workStarted', label: 'Work Started', type: 'count' },
  { value: 'completed', label: 'Completed (100%)', type: 'count' },
  { value: 'inProgress', label: 'In Progress', type: 'count' },
  { value: 'notStarted', label: 'Not Started', type: 'count' },
  { value: 'blocked', label: 'Blocked/High Priority', type: 'count' },
  { value: 'avgProgress', label: 'Avg Progress %', type: 'average' },
  { value: 'totalSanction', label: 'Total Sanction (Lacs)', type: 'sum' },
  { value: 'totalAgreement', label: 'Total Agreement Amount', type: 'sum' },
  { value: 'totalBOQ', label: 'Total BOQ Amount', type: 'sum' },
];

export function DynamicSummaryReport({ works }: DynamicSummaryReportProps) {
  // Primary grouping (Rows)
  const [primaryGroup, setPrimaryGroup] = useState<string>('civil_zone');
  
  // Secondary grouping (Sub-rows) - optional
  const [secondaryGroup, setSecondaryGroup] = useState<string>('work_category');
  const [enableSecondaryGroup, setEnableSecondaryGroup] = useState(true);
  
  // Selected metrics to display
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'count',
    'nitPublished',
    'tender',
    'part1',
    'part2',
    'loi',
    'agreementSigned',
    'workStarted',
  ]);

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Calculate metrics for a group of works
  const calculateMetrics = (groupWorks: Work[]) => {
    const metrics: any = {
      count: groupWorks.length,
      nitPublished: groupWorks.filter(w => w.nit_date).length,
      tender: groupWorks.filter(w => w.tender_no).length,
      part1: groupWorks.filter(w => w.part1_opening_date).length,
      part2: groupWorks.filter(w => w.part2_opening_date).length,
      loi: groupWorks.filter(w => w.loi_no_and_date).length,
      agreementSigned: groupWorks.filter(w => w.agreement_no_and_date).length,
      workStarted: groupWorks.filter(w => (w.progress_percentage || 0) > 0).length,
      completed: groupWorks.filter(w => (w.progress_percentage || 0) === 100).length,
      inProgress: groupWorks.filter(w => {
        const p = w.progress_percentage || 0;
        return p > 0 && p < 100;
      }).length,
      notStarted: groupWorks.filter(w => (w.progress_percentage || 0) === 0).length,
      blocked: groupWorks.filter(w => w.is_blocked).length,
      avgProgress: groupWorks.length > 0
        ? (groupWorks.reduce((sum, w) => sum + (w.progress_percentage || 0), 0) / groupWorks.length).toFixed(1)
        : 0,
      totalSanction: groupWorks.reduce((sum, w) => sum + (w.sanction_amount_lacs || 0), 0).toFixed(2),
      totalAgreement: groupWorks.reduce((sum, w) => sum + (w.agreement_amount || 0), 0).toFixed(2),
      totalBOQ: groupWorks.reduce((sum, w) => sum + (w.boq_amount || 0), 0).toFixed(2),
    };
    return metrics;
  };

  // Generate summary data based on selected groupings
  const summaryData = useMemo(() => {
    const data: any = {};
    const grandTotal: any = {};

    works.forEach((work) => {
      const primaryValue = (work[primaryGroup as keyof Work] as string) || "Unknown";
      
      if (!data[primaryValue]) {
        data[primaryValue] = {
          works: [],
          secondary: {},
        };
      }

      data[primaryValue].works.push(work);

      if (enableSecondaryGroup) {
        const secondaryValue = (work[secondaryGroup as keyof Work] as string) || "Uncategorized";
        
        if (!data[primaryValue].secondary[secondaryValue]) {
          data[primaryValue].secondary[secondaryValue] = [];
        }
        
        data[primaryValue].secondary[secondaryValue].push(work);
      }
    });

    // Calculate metrics for each group
    Object.keys(data).forEach(primaryKey => {
      data[primaryKey].metrics = calculateMetrics(data[primaryKey].works);
      
      if (enableSecondaryGroup) {
        Object.keys(data[primaryKey].secondary).forEach(secondaryKey => {
          data[primaryKey].secondary[secondaryKey] = {
            works: data[primaryKey].secondary[secondaryKey],
            metrics: calculateMetrics(data[primaryKey].secondary[secondaryKey]),
          };
        });
      }
    });

    // Calculate grand totals
    grandTotal.metrics = calculateMetrics(works);

    return { groups: data, grandTotal };
  }, [works, primaryGroup, secondaryGroup, enableSecondaryGroup]);

  const sortedPrimaryGroups = Object.keys(summaryData.groups).sort();

  const getMetricLabel = (metricValue: string) => {
    return METRIC_OPTIONS.find(m => m.value === metricValue)?.label || metricValue;
  };

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardHeader className="border-b border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              📊 Dynamic Summary Report
            </CardTitle>
            <CardDescription>
              Customize grouping and metrics like Excel Pivot Table
            </CardDescription>
          </div>

          {/* Configuration Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Primary Grouping */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Group By: {GROUPING_OPTIONS.find(g => g.value === primaryGroup)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Primary Grouping (Rows)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={primaryGroup} onValueChange={setPrimaryGroup}>
                  {GROUPING_OPTIONS.map(option => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Secondary Grouping */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Sub-Group: {enableSecondaryGroup ? GROUPING_OPTIONS.find(g => g.value === secondaryGroup)?.label : 'None'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Secondary Grouping (Sub-rows)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={enableSecondaryGroup}
                  onCheckedChange={setEnableSecondaryGroup}
                >
                  Enable Sub-Grouping
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {enableSecondaryGroup && (
                  <DropdownMenuRadioGroup value={secondaryGroup} onValueChange={setSecondaryGroup}>
                    {GROUPING_OPTIONS.filter(o => o.value !== primaryGroup).map(option => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Metrics Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Metrics ({selectedMetrics.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Select Metrics to Display</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {METRIC_OPTIONS.map(metric => (
                  <DropdownMenuCheckboxItem
                    key={metric.value}
                    checked={selectedMetrics.includes(metric.value)}
                    onCheckedChange={() => toggleMetric(metric.value)}
                  >
                    {metric.label}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {metric.type}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-900 border-r w-[50px]">S.No.</TableHead>
              <TableHead className="font-bold text-slate-900 border-r min-w-[200px]">
                {GROUPING_OPTIONS.find(g => g.value === primaryGroup)?.label}
                {enableSecondaryGroup && ` / ${GROUPING_OPTIONS.find(g => g.value === secondaryGroup)?.label}`}
              </TableHead>
              {selectedMetrics.map(metric => (
                <TableHead key={metric} className="font-bold text-slate-900 text-center border-r">
                  {getMetricLabel(metric)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPrimaryGroups.map((primaryKey, index) => {
              const groupData = summaryData.groups[primaryKey];
              const isCollapsed = collapsedGroups.has(primaryKey);
              const secondaryKeys = enableSecondaryGroup ? Object.keys(groupData.secondary).sort() : [];

              return (
                <Fragment key={primaryKey}>
                  {/* Primary Group Header Row */}
                  <TableRow className="bg-slate-100 font-semibold hover:bg-slate-200 cursor-pointer" onClick={() => enableSecondaryGroup && toggleGroup(primaryKey)}>
                    <TableCell className="border-r text-center">{index + 1}</TableCell>
                    <TableCell className="border-r">
                      <div className="flex items-center gap-2">
                        {enableSecondaryGroup && (
                          isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                        <span>{primaryKey}</span>
                        <Badge variant="secondary" className="ml-2">
                          {groupData.works.length} works
                        </Badge>
                      </div>
                    </TableCell>
                    {selectedMetrics.map(metric => (
                      <TableCell key={metric} className="border-r text-center font-semibold">
                        {groupData.metrics[metric]}
                        {metric === 'avgProgress' && '%'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Secondary Group Rows */}
                  {enableSecondaryGroup && !isCollapsed && secondaryKeys.map((secondaryKey, secIndex) => (
                    <TableRow key={`${primaryKey}-${secondaryKey}`} className="hover:bg-slate-50">
                      <TableCell className="border-r text-center text-slate-500 text-xs">
                        {index + 1}.{secIndex + 1}
                      </TableCell>
                      <TableCell className="border-r pl-12 text-sm">
                        {secondaryKey}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {groupData.secondary[secondaryKey].works.length}
                        </Badge>
                      </TableCell>
                      {selectedMetrics.map(metric => (
                        <TableCell key={metric} className="border-r text-center text-sm">
                          {groupData.secondary[secondaryKey].metrics[metric]}
                          {metric === 'avgProgress' && '%'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}

            {/* Grand Total Row */}
            <TableRow className="bg-slate-900 text-white font-bold text-base">
              <TableCell className="border-r border-slate-700"></TableCell>
              <TableCell className="border-r border-slate-700 text-right pr-4">
                Grand Total
                <Badge variant="secondary" className="ml-2 bg-white text-slate-900">
                  {works.length} works
                </Badge>
              </TableCell>
              {selectedMetrics.map(metric => (
                <TableCell key={metric} className="border-r border-slate-700 text-center">
                  {summaryData.grandTotal.metrics[metric]}
                  {metric === 'avgProgress' && '%'}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
